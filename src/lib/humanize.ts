import { OutputType } from '@/types';

/**
 * List of common AI clichés and boilerplate phrases to eliminate or soften.
 */
const AI_CLICHES: Array<{ pattern: RegExp; replacement: string | ((match: string) => string) }> = [
  // Robotic openers & transitions
  { pattern: /\b(?:in today['’]s fast-paced world|in today['’]s digital landscape|in the fast-paced world of|in an increasingly connected world)\b,?\s*/gi, replacement: '' },
  { pattern: /\b(?:let['’]s dive in|let['’]s dive into|dive in and explore|without further ado)\b:?\s*/gi, replacement: '' },
  { pattern: /\b(?:look no further than|it goes without saying that|needless to say)\b,?\s*/gi, replacement: '' },
  { pattern: /\b(?:in this (?:post|article|update|thread|briefing), we (?:will )?(?:explore|discuss|break down|examine))\b:?\s*/gi, replacement: '' },

  // Overused buzzwords & clichés
  { pattern: /\b(?:game-changer|game changer)\b/gi, replacement: 'major breakthrough' },
  { pattern: /\b(?:game-changing|game changing)\b/gi, replacement: 'significant' },
  { pattern: /\bdelve into\b/gi, replacement: 'examine' },
  { pattern: /\bdelving into\b/gi, replacement: 'examining' },
  { pattern: /\bdelves into\b/gi, replacement: 'examines' },
  { pattern: /\bdelve\b/gi, replacement: 'explore' },
  { pattern: /\b(?:a testament to|stands as a testament to)\b/gi, replacement: 'evidence of' },
  { pattern: /\b(?:beacon of hope|beacon of)\b/gi, replacement: 'model of' },
  { pattern: /\b(?:rich tapestry of|tapestry of)\b/gi, replacement: 'network of' },
  { pattern: /\b(?:paramount importance|of paramount importance)\b/gi, replacement: 'critical' },
  { pattern: /\b(?:it is crucial to remember that|it is worth noting that)\b/gi, replacement: 'Note that' },

  // Robotic conclusion clichés
  { pattern: /\b(?:in conclusion|to wrap up|all in all|at the end of the day)\b,?\s*/gi, replacement: '' },
  { pattern: /\b(?:only time will tell|the future looks bright|the future is bright)\.?\s*/gi, replacement: '' },
];

/**
 * Humanizes text by:
 * 1. Replacing artificial em dashes (—) and en dashes (–) with natural punctuation.
 * 2. Removing repetitive AI clichés and marketing fluff.
 * 3. Preserving all factual numbers, dates, monetary amounts, and source citations ([S1], [S2]).
 * 4. Applying platform-specific cadence and punctuation rules.
 */
export function humanizeText(text: string, platform?: OutputType | string): string {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  // 1. Replace em dashes (—) and spaced en dashes ( – ) with natural punctuation.
  // Preserves number ranges like "2020–2026" or "10–15%" by only targeting dashes surrounded by words/spaces.
  result = result.replace(/(\w)\s*—\s*(\w)/g, '$1, $2');
  result = result.replace(/\s+—\s+/g, ' — '); // normalize standalone
  result = result.replace(/—\s*/g, ', ');     // convert leading or trailing em dashes to commas

  // Replace spaced en dashes used stylistically: "Policy – effective Monday" -> "Policy, effective Monday"
  result = result.replace(/([A-Za-z])\s+–\s+([A-Za-z])/g, '$1, $2');

  // 2. Remove / substitute AI clichés while protecting citations and dates
  for (const { pattern, replacement } of AI_CLICHES) {
    result = result.replace(pattern, replacement as any);
  }

  // 3. Clean up double commas, stray colons, or awkward spaces introduced by cliché stripping
  result = result.replace(/,\s*,/g, ',');
  result = result.replace(/^\s*,\s*/gm, '');
  result = result.replace(/:\s*,\s*/g, ': ');
  result = result.replace(/[ \t]{2,}/g, ' ');

  // 4. Platform-specific adjustments
  if (platform === 'whatsapp') {
    // Strip markdown h1/h2 headings while keeping clean emphasis
    result = result.replace(/^#+\s*(.*)$/gm, '*$1*');
  } else if (platform === 'twitter') {
    // Keep sentence starts direct
    result = result.replace(/^Hey everyone,?\s*/i, '');
  }

  // Ensure capitalization of sentence starts if a cliché was removed at the start of a sentence
  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  return result.trim();
}
