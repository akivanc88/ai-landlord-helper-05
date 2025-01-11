export function calculateRelevanceScore(chunkWords: string[], queryWords: string[]): number {
  let score = 0;
  const importantTerms = new Set([
    'pet', 'pets', 'animal', 'animals',
    'damage', 'deposit', 'deposits',
    'rent', 'rental', 'tenant', 'landlord',
    'rtb', 'decision', 'decisions',
    'increase', 'increased', 'increases',
    'capital', 'expenditure', 'expenditures',
    'expense', 'expenses',
    'additional', 'improvement', 'improvements'
  ]);

  for (const queryWord of queryWords) {
    if (chunkWords.includes(queryWord)) {
      // Give higher weight to important terms
      score += importantTerms.has(queryWord) ? 3 : 1;
      
      // Additional score for exact matches of multi-word phrases
      if (queryWord.includes(' ') && chunkWords.includes(queryWord)) {
        score += 2;
      }

      // Additional score for capital expenditure related terms appearing together
      if ((queryWord === 'capital' && chunkWords.includes('expenditure')) ||
          (queryWord === 'expenditure' && chunkWords.includes('capital')) ||
          (queryWord === 'rent' && chunkWords.includes('increase'))) {
        score += 3;
      }
    }
  }

  return score;
}