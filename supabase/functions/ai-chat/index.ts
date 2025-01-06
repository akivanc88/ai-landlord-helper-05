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

    // Prepare system prompt with context
    const basePrompt = userRole === 'landlord' ? LANDLORD_PROMPT : TENANT_PROMPT;
    const systemPrompt = relevantContext 
      ? `${basePrompt}\n\nRelevant context from BC housing resources:\n${relevantContext}\n\nUse the above context to inform your response when relevant. If the context doesn't address the specific question, rely on your general knowledge of BC housing laws. When citing information from the context, use the citation numbers [1], [2], etc. in your response.`
      : basePrompt;

    console.log('Sending request to OpenAI...');
    // Get AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('Received response from OpenAI');

    // Deduct question credit
    const { error: deductError } = await supabase.rpc(
      'deduct_question',
      { user_id_param: userId }
    );

    if (deductError) throw deductError;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        citations: citations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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