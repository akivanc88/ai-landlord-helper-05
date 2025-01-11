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
  'lease', 'eviction', 'repair', 'damage', 'payment',
  'increase', 'increases', 'increased',
  'capital', 'expenditure', 'expenditures',
  'decision', 'decisions', 'ruling', 'rulings',
  'additional', 'extra', 'cost', 'costs',
  'application', 'approve', 'approved', 'approval'
]);

// Multi-word terms that should be treated as single concepts
const multiWordTerms = [
  'rent increase',
  'capital expenditure',
  'capital expenditures',
  'additional rent',
  'rental increase',
  'past decisions',
  'previous rulings',
  'approved increases'
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
  for (const multiWordTerm of multiWordTerms) {
    if (queryWords.join(' ').includes(multiWordTerm) && 
        chunkWords.join(' ').includes(multiWordTerm)) {
      score += 5; // Higher score for multi-word matches
      console.log(`Found multi-word term match: ${multiWordTerm}`);
    }
  }

  for (const queryWord of queryWords) {
    if (chunkWords.includes(queryWord)) {
      // Give higher weight to important terms
      const termScore = importantTerms.has(queryWord) ? 3 : 1;
      score += termScore;
      console.log(`Term match: ${queryWord}, Score: ${termScore}`);
      
      // Additional score for exact matches of multi-word phrases
      if (queryWord.includes(' ') && chunkWords.includes(queryWord)) {
        score += 2;
        console.log(`Exact multi-word match: ${queryWord}`);
      }

      // Additional score for related terms appearing together
      const relatedPairs = [
        ['capital', 'expenditure'],
        ['rent', 'increase'],
        ['additional', 'rent'],
        ['past', 'decision'],
        ['previous', 'ruling'],
        ['approved', 'increase'],
        ['rental', 'cost'],
        ['tenant', 'application']
      ];

      for (const [term1, term2] of relatedPairs) {
        if ((queryWord === term1 && chunkWords.includes(term2)) ||
            (queryWord === term2 && chunkWords.includes(term1))) {
          score += 3;
          console.log(`Related pair match: ${term1}-${term2}`);
        }
      }
    }
  }

  // Lower the threshold by giving partial scores for similar terms
  const similarTerms = {
    'increase': ['raises', 'raised', 'raising'],
    'expenditure': ['expense', 'expenses', 'spending'],
    'capital': ['investment', 'improvements', 'upgrade'],
    'decision': ['ruling', 'determination', 'finding']
  };

  for (const [mainTerm, alternatives] of Object.entries(similarTerms)) {
    if (queryWords.includes(mainTerm)) {
      for (const alt of alternatives) {
        if (chunkWords.includes(alt)) {
          score += 1.5;
          console.log(`Similar term match: ${mainTerm}-${alt}`);
        }
      }
    }
  }

  console.log('Final relevance score:', score);
  return score;
}