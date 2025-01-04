import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

interface ChatMessage {
  role: string;
  content: string;
}

const getLandlordSystemPrompt = () => `
You are an AI assistant specializing in helping landlords manage their properties and understand their rights and responsibilities.
Focus on providing accurate, practical advice about:
- Property management best practices
- Legal obligations and rights
- Tenant screening and management
- Maintenance and repairs
- Financial aspects of property rental
Be professional, direct, and always consider legal compliance and ethical practices.
`;

const getTenantSystemPrompt = () => `
You are an AI assistant specializing in helping tenants understand their rights and navigate rental situations.
Focus on providing accurate, practical advice about:
- Tenant rights and protections
- Lease agreements and obligations
- Maintenance requests and living conditions
- Security deposits and rent
- Dealing with landlords professionally
Be supportive while maintaining professionalism, and always consider legal rights and ethical practices.
`;

const createChatCompletion = async (messages: ChatMessage[], temperature = 0.2) => {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages,
      temperature,
      max_tokens: 1000,
      return_images: false,
      return_related_questions: false,
      search_domain_filter: ['perplexity.ai'],
      search_recency_filter: 'month',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userRole, message, userId } = await req.json();

    // Validate input
    if (!userRole || !message || !userId) {
      throw new Error('Missing required fields');
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

    if (creditsError || !credits || credits.remaining_questions <= 0) {
      throw new Error('No questions available');
    }

    // Set up the conversation with the appropriate system prompt
    const systemPrompt = userRole === 'landlord' 
      ? getLandlordSystemPrompt() 
      : getTenantSystemPrompt();

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Get AI response
    const aiResponse = await createChatCompletion(messages);

    // Deduct a question credit
    const { error: deductError } = await supabaseClient.rpc(
      'deduct_question',
      { user_id_param: userId }
    );

    if (deductError) {
      throw new Error('Failed to deduct question credit');
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});