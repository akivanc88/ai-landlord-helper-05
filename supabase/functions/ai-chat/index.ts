import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
      console.error('Missing required fields:', { userRole, message, userId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key for admin access
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user has questions available with better error handling
    try {
      console.log('Checking credits for user:', userId);
      
      const { data: credits, error: creditsError } = await supabaseAdmin
        .from('question_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (creditsError) {
        console.error('Database error when checking credits:', creditsError);
        throw new Error('Database query failed');
      }

      console.log('Credits check result:', credits);

      if (!credits) {
        console.log('No credits record found for user:', userId);
        return new Response(
          JSON.stringify({ 
            error: 'No questions available',
            details: 'No credit record found'
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const hasAvailableQuestions = credits.remaining_questions > 0;
      const isExpired = credits.expiry_date ? new Date(credits.expiry_date) < new Date() : false;

      console.log('Credit status:', {
        userId,
        remaining: credits.remaining_questions,
        expired: isExpired,
        hasAvailable: hasAvailableQuestions
      });

      if (!hasAvailableQuestions || isExpired) {
        return new Response(
          JSON.stringify({ 
            error: 'No questions available',
            details: isExpired ? 'Credits have expired' : 'No remaining credits'
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
      if (!OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        throw new Error('OpenAI API key not configured');
      }

      console.log('Sending request to OpenAI');
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

      // Deduct a question credit using admin client
      console.log('Deducting question credit for user:', userId);
      const { error: deductError } = await supabaseAdmin.rpc(
        'deduct_question',
        { user_id_param: userId }
      );

      if (deductError) {
        console.error('Error deducting question credit:', deductError);
        throw new Error('Failed to deduct question credit');
      }

      return new Response(
        JSON.stringify({ response: aiResponse }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check question credits', 
          details: dbError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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