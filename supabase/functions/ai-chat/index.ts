import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { LANDLORD_PROMPT, TENANT_PROMPT, corsHeaders, findRelevantContext } from "./utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userRole, message, userId } = await req.json();
    console.log('Processing request for user:', userId, 'with role:', userRole);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check question credits
    const { data: credits, error: creditsError } = await supabase
      .from('question_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditsError) throw creditsError;

    if (!credits || credits.remaining_questions <= 0 || 
        (credits.expiry_date && new Date(credits.expiry_date) < new Date())) {
      return new Response(
        JSON.stringify({ error: 'No questions available' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find relevant context
    console.log('Searching for relevant context...');
    const { context: relevantContext, citations } = await findRelevantContext(supabase, message);
    console.log('Found relevant context:', relevantContext ? 'Yes' : 'No');

    // Prepare system prompt
    const basePrompt = userRole === 'landlord' ? LANDLORD_PROMPT : TENANT_PROMPT;
    const systemPrompt = relevantContext 
      ? `${basePrompt}\n\nRelevant context from BC housing resources:\n${relevantContext}`
      : basePrompt;

    // Create transform stream for handling the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process in background
    (async () => {
      try {
        console.log('Sending request to OpenAI...');
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            stream: true,
          }),
        });

        if (!openAIResponse.ok) {
          const error = await openAIResponse.text();
          throw new Error(`OpenAI API error: ${error}`);
        }

        const reader = openAIResponse.body?.getReader();
        if (!reader) throw new Error('No reader available');

        let accumulatedResponse = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.includes('[DONE]')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(5);
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  accumulatedResponse += content;
                  await writer.write(encoder.encode(content));
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }

          // Save the complete message
          await supabase.from('messages').insert({
            user_id: userId,
            text: accumulatedResponse,
            is_ai: true,
            citations,
            role: userRole,
            thread_id: null
          });

          // Deduct question credit
          await supabase.rpc('deduct_question', { user_id_param: userId });

        } finally {
          reader.releaseLock();
          await writer.close();
        }
      } catch (error) {
        console.error('Error in streaming:', error);
        const errorMessage = JSON.stringify({ error: error.message });
        await writer.write(encoder.encode(errorMessage));
        await writer.close();
      }
    })();

    // Return the readable stream
    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});