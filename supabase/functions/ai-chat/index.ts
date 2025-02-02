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
        JSON.stringify({ 
          error: 'No questions available',
          details: !credits ? 'No credit record found' : 'No remaining credits or credits expired'
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find relevant context from knowledge base
    console.log('Searching for relevant context...');
    const { context: relevantContext, citations } = await findRelevantContext(supabase, message);
    console.log('Found relevant context:', relevantContext ? 'Yes' : 'No');

    // Prepare system prompt with context and instructions
    const basePrompt = userRole === 'landlord' ? LANDLORD_PROMPT : TENANT_PROMPT;
    const systemPrompt = relevantContext 
      ? `${basePrompt}\n\nRelevant context from BC housing resources:\n${relevantContext}\n\nInstructions for using citations:
1. When you find relevant information in the provided citations, quote it directly using "..." and cite the source using [X].
2. After quoting, explain or elaborate on the quoted content.
3. Make sure to integrate multiple citations if they are relevant to the question.
4. Always maintain proper citation numbering [1], [2], etc.
5. Use the exact text from citations when quoting.`
      : basePrompt;

    // Set up streaming
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start the OpenAI request
    console.log('Sending request to OpenAI...');
    fetch('https://api.openai.com/v1/chat/completions', {
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
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

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
                await writer.write(encoder.encode(content));
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } finally {
        reader.releaseLock();
        await writer.close();
      }
    }).catch(async (error) => {
      console.error('Error in streaming:', error);
      const errorMessage = JSON.stringify({ error: error.message });
      await writer.write(encoder.encode(errorMessage));
      await writer.close();
    });

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
      JSON.stringify({ 
        error: error.message,
        details: 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});