import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to chunk text into smaller pieces
function chunkText(text: string, maxChunkSize = 1000): { text: string, metadata: { position: number } }[] {
  const words = text.split(' ');
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, id } = await req.json();
    
    if (!type || !content || !id) {
      throw new Error('Missing required parameters');
    }

    // Clean and sanitize the content
    const cleanContent = content.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFD\uFFFE\uFFFF]/g, '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process the content into chunks
    const chunks = chunkText(cleanContent);
    
    // Determine which table to update based on content type
    const table = type === 'url' ? 'knowledge_urls' : 'knowledge_pdfs';
    
    console.log('Updating table:', table, 'with ID:', id);

    // Update the database with processed content
    const { error: updateError } = await supabase
      .from(table)
      .update({
        content: cleanContent,
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