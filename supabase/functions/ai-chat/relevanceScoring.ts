export function calculateRelevanceScore(chunkWords: string[], queryWords: string[]): number {
  let score = 0;
  const importantTerms = new Set([
    'pet', 'pets', 'animal', 'animals',
    'damage', 'deposit', 'deposits',
    'rent', 'rental', 'tenant', 'landlord',
    'rtb', 'decision', 'decisions'
  ]);

  for (const queryWord of queryWords) {
    if (chunkWords.includes(queryWord)) {
      // Give higher weight to important terms
      score += importantTerms.has(queryWord) ? 3 : 1;
      
      // Additional score for exact matches of multi-word phrases
      if (queryWord.includes(' ') && chunkWords.includes(queryWord)) {
        score += 2;
      }
    }
  }

  return score;
}