import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { userRole, message, userId } = await req.json();

    // Validate input
    if (!userRole || !message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user has questions available
    const { data: credits, error: creditsError } = await supabaseClient
      .from('question_credits')
      .select('remaining_questions')
      .eq('user_id', userId)
      .single();

    console.log('Credits check result:', { credits, creditsError });

    if (creditsError) {
      console.error('Error checking credits:', creditsError);
      return new Response(
        JSON.stringify({ error: 'Failed to check question credits' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!credits || credits.remaining_questions <= 0) {
      console.log('No questions available for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'No questions available',
          details: 'User has no remaining question credits'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Set up the conversation with the appropriate system prompt
    const systemPrompt = userRole === 'landlord' 
      ? `You are an AI assistant specializing in helping landlords manage their properties and understand their rights and responsibilities.
         Focus on providing accurate, practical advice about:
         - Property management best practices
         - Legal obligations and rights
         - Tenant screening and management
         - Maintenance and repairs
         - Financial aspects of property rental
         Be professional, direct, and always consider legal compliance and ethical practices.`
      : `You are an AI assistant specializing in helping tenants understand their rights and navigate rental situations.
         Focus on providing accurate, practical advice about:
         - Tenant rights and protections
         - Lease agreements and obligations
         - Maintenance requests and living conditions
         - Security deposits and rent
         - Dealing with landlords professionally
         Be supportive while maintaining professionalism, and always consider legal rights and ethical practices.`;

    // Get AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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

    // Deduct a question credit
    const { error: deductError } = await supabaseClient.rpc(
      'deduct_question',
      { user_id_param: userId }
    );

    if (deductError) {
      console.error('Error deducting question credit:', deductError);
      return new Response(
        JSON.stringify({ error: 'Failed to deduct question credit' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

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