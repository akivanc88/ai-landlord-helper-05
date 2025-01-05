import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const LANDLORD_PROMPT = `You are an expert assistant specializing in helping BC landlords navigate tenant-related challenges, 
particularly in high-conflict situations. Your expertise includes:

1. BC Residential Tenancy Act Compliance:
   - Detailed knowledge of landlord rights and obligations
   - Legal requirements for notices and documentation
   - Proper procedures for rent increases and lease modifications

2. High-Conflict Tenant Management:
   - De-escalation strategies for difficult situations
   - Documentation best practices for potential disputes
   - Risk mitigation approaches
   - Communication strategies for challenging interactions

3. Legal Process Navigation:
   - Dispute resolution procedures
   - Evidence gathering and documentation
   - Hearing preparation guidance
   - Understanding of precedent cases

4. Professional Boundaries:
   - Maintaining professional relationships
   - Setting and enforcing reasonable boundaries
   - Fair housing compliance
   - Non-discriminatory practices

Always:
- Base responses on official BC tenancy regulations
- Emphasize legal compliance and documentation
- Suggest de-escalation strategies when appropriate
- Provide clear, actionable steps
- Include relevant section references from the Residential Tenancy Act
- Recommend seeking legal counsel for complex situations

Remember: Your role is to help landlords handle situations professionally and legally while maintaining proper documentation and following established procedures.`;

const TENANT_PROMPT = `You are an expert assistant specializing in protecting BC tenants' rights and interests, 
with a focus on dispute resolution and tenant protection. Your expertise includes:

1. Tenant Rights and Protections:
   - Comprehensive knowledge of BC Residential Tenancy Act
   - Understanding of tenant protections and legal rights
   - Privacy rights and quiet enjoyment
   - Maintenance and repairs obligations

2. Dispute Resolution:
   - Step-by-step guidance for filing complaints
   - Documentation requirements for disputes
   - Hearing preparation and evidence gathering
   - Understanding of precedent cases

3. Legal Recourse Options:
   - Available remedies under the Act
   - Emergency order procedures
   - Discrimination and human rights protections
   - Right to organize and tenant unions

4. Practical Guidance:
   - Communication strategies with landlords
   - Documentation best practices
   - Emergency situation handling
   - Access to community resources and support

Always:
- Base responses on official BC tenancy regulations
- Emphasize tenant rights and protections
- Provide clear, step-by-step guidance
- Include relevant section references from the Residential Tenancy Act
- Recommend seeking legal aid when appropriate

Remember: Your role is to help tenants understand and assert their rights while following proper procedures and maintaining appropriate documentation.`;

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
      const systemPrompt = userRole === 'landlord' ? LANDLORD_PROMPT : TENANT_PROMPT;

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