import { SourceSpan } from '@/types';

/**
 * Strips PDF/document artifacts (page numbers, headers, footers, trailing hyphens)
 * and unwraps artificial line breaks while preserving paragraph boundaries.
 */
export function cleanRawDocumentText(rawText: string): string {
  if (!rawText) return '';

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Skip page number indicators: "Page 2 of 28", "2 of 28", "Page 2", standalone numbers
    if (/^(?:page\s+)?\d+\s*(?:of|\/)\s*\d+$/i.test(line)) continue;
    if (/^page\s+\d+$/i.test(line)) continue;
    if (/^\d{1,3}$/.test(line)) continue;

    // 2. Skip standalone chapter labels: "CHAPTER FIVE", "CHAPTER 5"
    if (/^chapter\s+([0-9ivxlcdm]+|\w+)\s*$/i.test(line)) continue;

    // 3. Skip common footer/header artifacts
    if (/^(all\s+rights\s+reserved|confidential|draft|table\s+of\s+contents)$/i.test(line)) continue;

    cleanedLines.push(line);
  }

  // Re-join lines and unwrap artificial line breaks from PDFs
  let text = cleanedLines.join('\n');

  // Fix words hyphenated across lines: "co- \nexistence" -> "co-existence", "infor- \nmation" -> "information"
  text = text.replace(/(\b\w+)-\s*\n\s*(\w+\b)/g, '$1$2');

  // Unwrap lines that don't end in sentence-ending punctuation (. ! ? : ;)
  // If line ends with a word/comma and next starts with a letter/quote, join with a space
  text = text.replace(/([^\.!\?:;\n\s])\n([A-Za-z0-9"“'‘(])/g, '$1 $2');

  // Collapse multiple spaces into single space
  text = text.replace(/[ \t]+/g, ' ');
  // Normalize multiple newlines to double newline
  text = text.replace(/\n\s*\n+/g, '\n\n');

  return text.trim();
}

/**
 * Deterministically splits raw text into complete, high-quality sentence spans with sequential IDs [S1, S2, ...]
 */
export function tokenizeTextIntoSpans(rawText: string): SourceSpan[] {
  if (!rawText || !rawText.trim()) return [];

  const cleanedText = cleanRawDocumentText(rawText);

  // Split on sentence boundaries: (. ! ?) followed by whitespace or double newlines
  const sentenceRegex = /([^\.!\?\n]+[\.!\?]+(?=\s|$)|[^\.!\?\n]+(?=\n\n|$))/g;
  const matches = cleanedText.match(sentenceRegex) || [cleanedText];

  const spans: SourceSpan[] = [];
  let spanIndex = 1;

  for (const match of matches) {
    const trimmed = match.trim().replace(/\s+/g, ' ');

    // Filter out page artifacts, single words, or incomplete fragments
    const isArtifact =
      /^(?:page\s+)?\d+\s*(?:of|\/)\s*\d+/i.test(trimmed) ||
      /^page\s+\d+$/i.test(trimmed) ||
      /^\d+$/i.test(trimmed) ||
      /^chapter\s+/i.test(trimmed);

    // Require meaningful length (at least 25 characters) and substance
    if (trimmed.length >= 25 && !isArtifact) {
      spans.push({
        id: `S${spanIndex}`,
        text: trimmed,
        index: spanIndex - 1,
      });
      spanIndex++;
    }
  }

  // Fallback if regex yielded empty
  if (spans.length === 0 && cleanedText.length > 0) {
    spans.push({
      id: 'S1',
      text: cleanedText.substring(0, 300),
      index: 0,
    });
  }

  return spans;
}
