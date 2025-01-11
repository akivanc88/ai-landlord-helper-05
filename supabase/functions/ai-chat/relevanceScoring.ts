// Helper function to extract important terms from a text
function extractImportantTerms(text: string): Set<string> {
  // Convert text to lowercase and split into words
  const words = text.toLowerCase().split(/\s+/);
  
  // Count word frequencies
  const wordFrequency: { [key: string]: number } = {};
  words.forEach(word => {
    // Ignore common stop words and very short words
    if (word.length > 3 && !isStopWord(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });

  // Consider words that appear multiple times as important
  const frequencyThreshold = 3; // Words appearing 3 or more times
  return new Set(
    Object.entries(wordFrequency)
      .filter(([_, count]) => count >= frequencyThreshold)
      .map(([word]) => word)
  );
}

// Basic stop words list (can be expanded)
const stopWords = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
  'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
  'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
  'if', 'about', 'who', 'get', 'which', 'go', 'me'
]);

function isStopWord(word: string): boolean {
  return stopWords.has(word.toLowerCase());
}

// Base important terms that are always included
const baseImportantTerms = new Set([
  'rent', 'tenant', 'landlord', 'deposit', 'notice',
  'lease', 'eviction', 'repair', 'damage', 'payment'
]);

export function calculateRelevanceScore(
  chunkWords: string[], 
  queryWords: string[], 
  knowledgeContent?: string
): number {
  let score = 0;
  
  // Combine base terms with dynamically extracted terms
  const importantTerms = new Set([
    ...baseImportantTerms,
    ...(knowledgeContent ? extractImportantTerms(knowledgeContent) : [])
  ]);

  for (const queryWord of queryWords) {
    if (chunkWords.includes(queryWord)) {
      // Give higher weight to important terms
      score += importantTerms.has(queryWord) ? 3 : 1;
      
      // Additional score for exact matches of multi-word phrases
      if (queryWord.includes(' ') && chunkWords.includes(queryWord)) {
        score += 2;
      }

      // Additional score for related terms appearing together
      const relatedPairs = [
        ['capital', 'expenditure'],
        ['rent', 'increase'],
        ['security', 'deposit'],
        ['notice', 'eviction'],
        ['repair', 'maintenance']
      ];

      for (const [term1, term2] of relatedPairs) {
        if ((queryWord === term1 && chunkWords.includes(term2)) ||
            (queryWord === term2 && chunkWords.includes(term1))) {
          score += 3;
        }
      }
    }
  }

  return score;
}