export function preprocessText(text: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Split into words
  const words = cleanText.split(/\s+/);
  
  // Generate word pairs for multi-word concepts
  const wordPairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    wordPairs.push(`${words[i]} ${words[i + 1]}`);
  }
  
  return [...words, ...wordPairs];
}

export function sanitizeContent(content: string): string {
  // Remove any binary or non-printable characters
  let cleaned = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Replace multiple spaces/newlines with single ones
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove any remaining special characters that might cause display issues
  cleaned = cleaned.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
  
  // Remove any PDF-specific markers or artifacts
  cleaned = cleaned.replace(/endstream|endobj|obj|stream/g, '');
  cleaned = cleaned.replace(/<<\/Filter\/FlateDecode\/Length \d+>>/g, '');
  
  return cleaned.trim();
}