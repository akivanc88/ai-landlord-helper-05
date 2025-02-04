import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function processWithLlamaparse(pdfContent: Uint8Array): Promise<{ text: string, chunks: any[] }> {
  console.log('Processing PDF with Llamaparse...');
  
  // Create form data
  const formData = new FormData();
  
  // Convert Uint8Array to Blob
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  formData.append('file', blob, 'document.pdf');

  console.log('Sending request to Llamaparse API...');
  const response = await fetch('https://api.llamaparse.com/v1/parse', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('LLAMAPARSE_API_KEY')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Llamaparse API error:', error);
    throw new Error(`Llamaparse API error: ${error}`);
  }

  const result = await response.json();
  console.log('Llamaparse processing successful');
  
  // Process the chunks from Llamaparse
  const chunks = result.chunks.map((chunk: any, index: number) => ({
    text: chunk.text,
    metadata: {
      position: index,
      pageNumber: chunk.pageNumber,
      bbox: chunk.bbox,
    }
  }));

  return {
    text: result.text,
    chunks
  };
}

function processUrl(content: string, maxChunkSize = 1000): { text: string, chunks: any[] } {
  const cleanText = content
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
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

  return { text: cleanText, chunks };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const { type, content, id } = await req.json();
    
    if (!type || !id) {
      throw new Error('Missing required parameters');
    }

    console.log(`Processing ${type} document with ID: ${id}`);

    let processedContent;
    if (type === 'pdf') {
      // Convert base64 to Uint8Array
      const binaryContent = Uint8Array.from(atob(content), c => c.charCodeAt(0));
      
      console.log('Sending PDF to Llamaparse for processing...');
      processedContent = await processWithLlamaparse(binaryContent);
      console.log('Llamaparse processing completed');
    } else {
      processedContent = processUrl(content);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update the database with processed content
    const { error: updateError } = await supabase
      .from(type === 'url' ? 'knowledge_urls' : 'knowledge_pdfs')
      .update({
        content: processedContent.text,
        chunks: processedContent.chunks,
        updated_at: new Date().toISOString(),
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processedChunks: processedContent.chunks.length,
        firstChunkPreview: processedContent.chunks[0]?.text.substring(0, 100)
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
