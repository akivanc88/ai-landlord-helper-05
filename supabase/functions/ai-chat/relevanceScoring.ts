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
  const frequencyThreshold = 2; // Lowered threshold to catch more relevant terms
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
  'lease', 'eviction', 'repair', 'damage', 'payment',
  'increase', 'increases', 'increased', 'raising',
  'capital', 'expenditure', 'expenditures', 'expense',
  'decision', 'decisions', 'ruling', 'rulings', 'precedent', 'precedents',
  'additional', 'extra', 'cost', 'costs', 'past', 'previous',
  'application', 'approve', 'approved', 'approval',
  'rtb', 'branch', 'residential', 'tenancy'
]);

// Multi-word terms that should be treated as single concepts
const multiWordTerms = [
  'rent increase',
  'rental increase',
  'capital expenditure',
  'capital expenditures',
  'additional rent',
  'past decisions',
  'previous rulings',
  'approved increases',
  'residential tenancy branch',
  'tenancy branch',
  'past precedent',
  'past precedents'
];

export function calculateRelevanceScore(
  chunkWords: string[], 
  queryWords: string[], 
  knowledgeContent?: string
): number {
  let score = 0;
  console.log('Calculating relevance score for chunk:', chunkWords.join(' ').substring(0, 100) + '...');
  
  // Combine base terms with dynamically extracted terms
  const importantTerms = new Set([
    ...baseImportantTerms,
    ...(knowledgeContent ? extractImportantTerms(knowledgeContent) : [])
  ]);

  // Check for multi-word terms in both query and chunk
  const queryText = queryWords.join(' ').toLowerCase();
  const chunkText = chunkWords.join(' ').toLowerCase();
  
  for (const multiWordTerm of multiWordTerms) {
    if (queryText.includes(multiWordTerm)) {
      // If the query contains the multi-word term, give extra weight to chunks containing it
      if (chunkText.includes(multiWordTerm)) {
        score += 8; // Increased weight for exact multi-word matches
        console.log(`Found exact multi-word term match: ${multiWordTerm}`);
      }
      // Also check for partial matches of the multi-word term
      const termParts = multiWordTerm.split(' ');
      const partialMatches = termParts.filter(part => chunkText.includes(part));
      if (partialMatches.length > 0) {
        score += partialMatches.length * 2;
        console.log(`Found partial matches for multi-word term: ${multiWordTerm}`);
      }
    }
  }

  // Check individual word matches with context
  for (const queryWord of queryWords) {
    if (chunkWords.includes(queryWord)) {
      // Give higher weight to important terms
      const termScore = importantTerms.has(queryWord) ? 5 : 1;
      score += termScore;
      console.log(`Term match: ${queryWord}, Score: ${termScore}`);

      // Additional score for related terms appearing together
      const relatedPairs = [
        ['capital', 'expenditure'],
        ['rent', 'increase'],
        ['additional', 'rent'],
        ['past', 'decision'],
        ['previous', 'ruling'],
        ['approved', 'increase'],
        ['rental', 'cost'],
        ['tenant', 'application'],
        ['rtb', 'decision'],
        ['branch', 'ruling']
      ];

      for (const [term1, term2] of relatedPairs) {
        if ((queryWord === term1 && chunkWords.includes(term2)) ||
            (queryWord === term2 && chunkWords.includes(term1))) {
          score += 5; // Increased weight for related term pairs
          console.log(`Related pair match: ${term1}-${term2}`);
        }
      }
    }
  }

  // Check for similar terms with partial scoring
  const similarTerms = {
    'increase': ['raises', 'raised', 'raising', 'increment', 'adjustment'],
    'expenditure': ['expense', 'expenses', 'spending', 'cost', 'costs'],
    'capital': ['investment', 'improvements', 'upgrade', 'renovation'],
    'decision': ['ruling', 'determination', 'finding', 'precedent'],
    'past': ['previous', 'prior', 'earlier', 'historical'],
    'additional': ['extra', 'supplemental', 'further', 'more']
  };

  for (const [mainTerm, alternatives] of Object.entries(similarTerms)) {
    if (queryText.includes(mainTerm)) {
      for (const alt of alternatives) {
        if (chunkText.includes(alt)) {
          score += 3; // Increased weight for similar term matches
          console.log(`Similar term match: ${mainTerm}-${alt}`);
        }
      }
    }
  }

  // Boost score if chunk contains numerical values (likely to be relevant for decisions)
  if (/\d+/.test(chunkText) && queryText.includes('decision')) {
    score += 2;
    console.log('Found numerical values in chunk');
  }

  console.log('Final relevance score:', score);
  return score;
}