export const LANDLORD_PROMPT = `You are an expert assistant specializing in helping BC landlords navigate tenant-related challenges, 
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

export const TENANT_PROMPT = `You are an expert assistant specializing in protecting BC tenants' rights and interests, 
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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function findRelevantContext(supabase: any, message: string): Promise<string> {
  try {
    console.log('Fetching knowledge sources...');
    // Fetch all knowledge sources
    const [urlsResponse, pdfsResponse] = await Promise.all([
      supabase.from('knowledge_urls').select('chunks').eq('is_active', true),
      supabase.from('knowledge_pdfs').select('chunks').eq('is_active', true)
    ]);

    if (urlsResponse.error) {
      console.error('Error fetching URLs:', urlsResponse.error);
      throw urlsResponse.error;
    }

    if (pdfsResponse.error) {
      console.error('Error fetching PDFs:', pdfsResponse.error);
      throw pdfsResponse.error;
    }

    const allChunks = [
      ...(urlsResponse.data || []).flatMap(url => url.chunks || []),
      ...(pdfsResponse.data || []).flatMap(pdf => pdf.chunks || [])
    ];

    console.log(`Found ${allChunks.length} total chunks from knowledge base`);

    if (allChunks.length === 0) {
      console.log('No chunks found in knowledge base');
      return '';
    }

    // Simple relevance scoring based on word overlap
    const messageWords = new Set(message.toLowerCase().split(' '));
    const relevantChunks = allChunks
      .map(chunk => ({
        text: chunk.text,
        score: Array.from(messageWords).filter(word => 
          chunk.text.toLowerCase().includes(word)
        ).length
      }))
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    return relevantChunks.map(chunk => chunk.text).join('\n\n');
  } catch (error) {
    console.error('Error finding relevant context:', error);
    return '';
  }
}