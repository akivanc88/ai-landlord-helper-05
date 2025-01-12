import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to decode base64 content if needed
function decodeBase64IfNeeded(content: string): string {
  try {
    // Check if the content is base64 encoded
    if (content.match(/^[A-Za-z0-9+/=]+$/)) {
      return atob(content);
    }
    return content;
  } catch (error) {
    console.error('Error decoding content:', error);
    return content;
  }
}

// Function to sanitize and chunk text
function processText(text: string, maxChunkSize = 1000): { text: string, metadata: { position: number } }[] {
  // First decode if needed
  const decodedText = decodeBase64IfNeeded(text);
  
  // Remove non-printable characters and normalize whitespace
  const cleanText = decodedText
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '') // Remove non-ASCII characters
    .replace(/\\n/g, '\n') // Convert literal \n to newlines
    .replace(/\\"/g, '"') // Convert escaped quotes
    .trim();

  const words = cleanText.split(' ');
  const chunks = [];
  let currentChunk = '';
  let position = 0;

  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push({
          text: currentChunk,
          metadata: { position: position++ }
        });
      }
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

    console.log(`Processing ${type} document with ID: ${id}`);
    console.log('Content preview:', content.substring(0, 100));

    // Process and sanitize the content
    const chunks = processText(content);
    
    // Log the first chunk for debugging
    if (chunks.length > 0) {
      console.log('First processed chunk preview:', chunks[0].text.substring(0, 100));
    }

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
      JSON.stringify({ 
        success: true,
        processedChunks: chunks.length,
        firstChunkPreview: chunks[0]?.text.substring(0, 100)
      }),
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