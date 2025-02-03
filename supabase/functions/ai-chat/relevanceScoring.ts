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
  const frequencyThreshold = 2;
  return new Set(
    Object.entries(wordFrequency)
      .filter(([_, count]) => count >= frequencyThreshold)
      .map(([word]) => word)
  );
}

// Basic stop words list
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

// Reddit-specific terms that should boost relevance
const redditTerms = new Set([
  'reddit', 'subreddit', 'post', 'comment', 'thread',
  'vancouverlandlords', 'landlordbc', 'legaladvicecanada',
  'experience', 'advice', 'similar', 'situation', 'help'
]);

export function calculateRelevanceScore(
  chunkWords: string[], 
  queryWords: string[], 
  knowledgeContent?: string,
  sourceType?: string,
  subreddit?: string | null
): number {
  let score = 0;
  console.log('Calculating relevance score for chunk:', chunkWords.join(' ').substring(0, 100) + '...');
  
  // Combine base terms with dynamically extracted terms
  const importantTerms = new Set([
    ...baseImportantTerms,
    ...(knowledgeContent ? extractImportantTerms(knowledgeContent) : [])
  ]);

  // Boost score for Reddit sources from specific subreddits
  if (sourceType === 'reddit' && subreddit) {
    const targetSubreddits = ['vancouverlandlords', 'landlordbc', 'legaladvicecanada'];
    if (targetSubreddits.includes(subreddit.toLowerCase())) {
      score += 10; // Significant boost for preferred subreddits
      console.log(`Boosted score for preferred subreddit: ${subreddit}`);
    }
  }

  // Check for multi-word terms in both query and chunk
  const queryText = queryWords.join(' ').toLowerCase();
  const chunkText = chunkWords.join(' ').toLowerCase();
  
  for (const multiWordTerm of multiWordTerms) {
    if (queryText.includes(multiWordTerm)) {
      if (chunkText.includes(multiWordTerm)) {
        score += 8;
        console.log(`Found exact multi-word term match: ${multiWordTerm}`);
      }
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
      // Give higher weight to important terms and Reddit-specific terms
      let termScore = 1;
      if (importantTerms.has(queryWord)) termScore += 4;
      if (redditTerms.has(queryWord)) termScore += 3;
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
        ['branch', 'ruling'],
        ['reddit', 'experience'],
        ['similar', 'situation']
      ];

      for (const [term1, term2] of relatedPairs) {
        if ((queryWord === term1 && chunkWords.includes(term2)) ||
            (queryWord === term2 && chunkWords.includes(term1))) {
          score += 5;
          console.log(`Related pair match: ${term1}-${term2}`);
        }
      }
    }
  }

  // Boost score for recent Reddit posts (if date is available)
  if (sourceType === 'reddit' && chunkText.includes('post_date')) {
    try {
      const postDate = new Date(chunkText.match(/post_date:\s*([^\n]+)/)?.[1] || '');
      const now = new Date();
      const monthsOld = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld <= 6) { // Posts within last 6 months
        score += Math.max(0, 5 - monthsOld); // More recent posts get higher boost
        console.log(`Boosted score for recent post: ${monthsOld} months old`);
      }
    } catch (error) {
      console.error('Error parsing post date:', error);
    }
  }

  console.log('Final relevance score:', score);
  return score;
}