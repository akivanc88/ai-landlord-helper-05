import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to sanitize and chunk text
function processText(text: string, maxChunkSize = 1000): { text: string, metadata: { position: number } }[] {
  // Remove non-printable characters and normalize whitespace
  const cleanText = text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
    .trim();

  const words = cleanText.split(' ');
  const chunks = [];
  let currentChunk = '';
  let position = 0;

  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      chunks.push({
        text: currentChunk,
        metadata: { position: position++ }
      });
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push({
      text: currentChunk,
      metadata: { position: position }
    });
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, id } = await req.json();
    
    if (!type || !content || !id) {
      throw new Error('Missing required parameters');
    }

    // Process and sanitize the content
    const chunks = processText(content);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update the database with processed content
    const { error: updateError } = await supabase
      .from(type === 'url' ? 'knowledge_urls' : 'knowledge_pdfs')
      .update({
        content: chunks[0]?.text || '', // Store the first chunk as the main content
        chunks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error processing document', 
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    );
  }
});