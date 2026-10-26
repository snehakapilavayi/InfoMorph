import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { createHash } from 'node:crypto';
import {
  SourceSpan,
  SourceOfTruth,
  QuestionnairePreferences,
  OutputType,
  OutputItem,
  ClaimItem,
  ContradictionItem,
  VerificationResult,
  TrendSignal,
  FailedFormatItem
} from '@/types';
import {
  calculateStoryboardTimestamps,
  calculateAudioDuration
} from '@/lib/timeUtils';
import { humanizeText } from './humanize';
import { getTopicTrendSignals } from './trends';

// Candidates are not verified until a generation request succeeds.
const CANDIDATE_MODELS = [
  'models/gemini-3.5-flash', 'models/gemini-3.5-flash-lite',
  'models/gemini-3.6-flash', 'models/gemini-3.7-flash',
  'models/gemini-3.8-flash', 'models/gemini-3-flash-preview'
];
const MAX_MODEL_ATTEMPTS = 6;
const modelDiscoveryCache = new Map<string, { expiresAt: number; models: Promise<string[]> }>();

function sanitizedError(error: unknown, apiKey = ''): string {
  const err = error as { message?: unknown; cause?: { code?: unknown; message?: unknown } } | null;
  let message = String(err?.message ?? error);
  if (err?.cause) message += ' (' + String(err.cause.code ?? '') + ': ' + String(err.cause.message ?? '') + ')';
  const secrets = [apiKey, ...Object.entries(process.env)
    .filter(([name]) => /KEY|TOKEN|SECRET|PASSWORD|AUTHORIZATION/i.test(name))
    .map(([, value]) => value || '')].filter(value => value.length >= 4);
  for (const secret of secrets) message = message.split(secret).join('[REDACTED]');
  return message
    .replace(/AIza[\w-]+/g, '[REDACTED]')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[REDACTED]')
    .replace(/((?:authorization|x-goog-api-key|api[_-]?key|access_token)["']?\s*[:=]\s*)[^\r\n,}]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .slice(0, 1500);
}

function errorStatus(error: unknown): number | undefined {
  const err = error as { status?: unknown; code?: unknown } | null;
  const status = Number(err?.status ?? err?.code);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}

function isCredentialOrTrustError(error: unknown): boolean {
  const status = errorStatus(error);
  const err = error as { code?: string; cause?: { code?: string } } | null;
  return status === 401 || status === 403 ||
    /CERT|SELF_SIGNED|UNABLE_TO_VERIFY/.test(err?.cause?.code ?? err?.code ?? '');
}

async function discoverModels(client: GoogleGenAI, apiKey: string): Promise<string[]> {
  // Share in-flight discovery across requests without retaining the raw credential.
  const cacheKey = createHash('sha256').update(apiKey).digest('hex');
  const cached = modelDiscoveryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.models;
  if (modelDiscoveryCache.size >= 32) modelDiscoveryCache.delete(modelDiscoveryCache.keys().next().value!);
  const entry = { expiresAt: Date.now() + 5 * 60_000, models: Promise.resolve<string[]>([]) };
  entry.models = (async () => {
    try {
      const pager = await client.models.list({ config: {
        pageSize: 100, httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } }
      } });
      const names: string[] = [];
      for await (const model of pager) {
        if (model.name && /flash/i.test(model.name) &&
          !/image|tts|audio|live|native|robotics/i.test(model.name) &&
          model.supportedActions?.includes('generateContent')) names.push(model.name);
      }
      if (!names.length) throw new Error('Model discovery returned no compatible Flash text models');
      const rank = (name: string) => {
        const index = CANDIDATE_MODELS.findIndex(candidate => candidate.replace(/^models\//, '') === name.replace(/^models\//, ''));
        return index < 0 ? CANDIDATE_MODELS.length : index;
      };
      return [...new Set(names)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    } catch (error) {
      // Cache discovery failures briefly to avoid repeated list calls during an outage.
      entry.expiresAt = Date.now() + 30_000;
      console.warn('Gemini discovery failed (HTTP ' + (errorStatus(error) ?? 'none') + '): ' + sanitizedError(error, apiKey));
      if (isCredentialOrTrustError(error)) throw new Error('Gemini connection/configuration failed: ' + sanitizedError(error, apiKey));
      console.warn('Using unverified Gemini model candidates after discovery failure.');
      return [...CANDIDATE_MODELS];
    }
  })();
  modelDiscoveryCache.set(cacheKey, entry);
  return entry.models;
}

async function callGeminiWithModelFallback(
  client: GoogleGenAI,
  baseParams: Omit<GenerateContentParameters, 'model'>,
  apiKey = '',
  validate?: (text: string) => void
): Promise<{ response: GenerateContentResponse; model: string }> {
  const models = (await discoverModels(client, apiKey)).slice(0, MAX_MODEL_ATTEMPTS);
  const failures: string[] = [];
  for (const model of models) {
    try {
      const response = await client.models.generateContent({
        ...baseParams, model,
        config: { ...baseParams.config, httpOptions: { timeout: 60_000, retryOptions: { attempts: 1 } } }
      });
      const text = response.text;
      if (!text?.trim()) throw new Error('Gemini returned no text content');
      validate?.(text);
      console.info('Gemini generation succeeded: ' + model);
      return { response, model };
    } catch (error) {
      const failure = model + ' (HTTP ' + (errorStatus(error) ?? 'none') + '): ' + sanitizedError(error, apiKey);
      console.warn('Gemini attempt failed: ' + failure);
      failures.push(failure);
      // Authentication and certificate failures affect every model. Other HTTP,
      // transient network, and invalid structured responses try the next candidate.
      if (isCredentialOrTrustError(error)) break;
    }
  }
  throw new Error('Gemini generation failed; no synthetic content returned. ' + failures.join('; '));
}

type JsonSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  minItems?: number;
};
const stringSchema: JsonSchema = { type: 'string' };
const stringsSchema: JsonSchema = { type: 'array', items: stringSchema, minItems: 1 };
const objectSchema = (properties: Record<string, JsonSchema>, required = Object.keys(properties)): JsonSchema =>
  ({ type: 'object', properties, required });
const sourceOfTruthSchema = objectSchema({
  summary: stringSchema,
  coreFacts: { type: 'array', minItems: 1, items: objectSchema({
    factId: stringSchema, statement: stringSchema, sourceSpans: stringsSchema
  }) },
  entities: { type: 'array', items: objectSchema({ name: stringSchema, type: stringSchema }) },
  criticalMetrics: { type: 'array', items: objectSchema({ label: stringSchema, value: stringSchema, sourceSpan: stringSchema }) }
} satisfies Record<keyof SourceOfTruth, JsonSchema>);
const outputTypes: OutputType[] = ['instagram', 'youtube', 'linkedin', 'blog', 'whatsapp', 'twitter'];
const outputTypeSchema: JsonSchema = { type: 'string', enum: outputTypes };
// id/status and derived media fields are supplied locally, as before.
type GeneratedOutput = Pick<OutputItem, 'outputType' | 'title' | 'subtitle' | 'content' | 'claims'> &
  Pick<OutputItem, 'imageUrl' | 'storyboard' | 'hashtags'> & {
    qualityScore?: number | null;
    characterCount?: number;
    groundedPercent?: number | null;
  };
const generatedOutputSchema = objectSchema({
  outputType: outputTypeSchema, title: stringSchema, subtitle: stringSchema, content: stringSchema,
  qualityScore: { type: 'number' }, characterCount: { type: 'number' }, groundedPercent: { type: 'number' },
  claims: { type: 'array', minItems: 1, items: objectSchema({
    id: stringSchema, outputType: outputTypeSchema, claimText: stringSchema,
    sourceSpanIds: stringsSchema, grounded: { type: 'boolean' }, contradictionFlag: { type: 'boolean' },
    contradictionDetails: stringSchema
  }, ['id', 'outputType', 'claimText', 'sourceSpanIds', 'grounded', 'contradictionFlag']) },
  imageUrl: stringSchema,
  hashtags: { type: 'array', items: stringSchema },
  storyboard: { type: 'array', items: objectSchema({
    timestamp: stringSchema, title: stringSchema, visualDescription: stringSchema, narration: stringSchema
  }) }
} satisfies Record<keyof GeneratedOutput, JsonSchema>,
['outputType', 'title', 'subtitle', 'content', 'claims']);
const generatedOutputsSchema = objectSchema({ outputs: { type: 'array', minItems: 1, items: generatedOutputSchema } });

const verifiedClaimItemSchema = objectSchema({
  id: stringSchema,
  status: { type: 'string', enum: ['supported', 'partial', 'unsupported'] },
  explanation: stringSchema,
  suggestedCorrection: stringSchema,
  sourceAmbiguity: { type: 'boolean' }
}, ['id', 'status', 'explanation']);
const verifiedClaimsSchema = objectSchema({
  verifiedClaims: { type: 'array', items: verifiedClaimItemSchema }
});

const contradictionSchema = objectSchema({
  topic: stringSchema,
  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
  description: stringSchema,
  outputAType: outputTypeSchema,
  outputAText: stringSchema,
  outputBType: outputTypeSchema,
  outputBText: stringSchema,
  suggestedFix: stringSchema
});
const crossConsistencySchema = objectSchema({
  contradictions: { type: 'array', items: contradictionSchema }
});

function validateSchema(value: unknown, schema: JsonSchema, path = 'response'): void {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(path + ' must be an object');
    const object = value as Record<string, unknown>;
    for (const name of schema.required || []) {
      if (!(name in object)) throw new Error(path + '.' + name + ' is required');
    }
    for (const [name, property] of Object.entries(schema.properties || {})) {
      if (name in object) validateSchema(object[name], property, path + '.' + name);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < (schema.minItems || 0)) throw new Error(path + ' must be an array with at least ' + (schema.minItems || 0) + ' items');
    value.forEach((item, index) => validateSchema(item, schema.items!, path + '[' + index + ']'));
  } else if (typeof value !== schema.type || (schema.type === 'number' && !Number.isFinite(value))) {
    throw new Error(path + ' must be a ' + schema.type);
  } else if (schema.enum && !schema.enum.includes(value as string)) {
    throw new Error(path + ' is not an allowed value');
  }
}

function parseStructuredJson<T>(text: string, schema: JsonSchema): T {
  const trimmed = text.replace(/^\uFEFF/, '').trim().replace(/^\x60\x60\x60(?:json)?\s*([\s\S]*?)\s*\x60\x60\x60$/i, '$1').trim();
  let parsed: unknown;
  try { parsed = JSON.parse(trimmed); }
  catch (error) { throw new Error('Gemini JSON parsing failed: ' + sanitizedError(error)); }
  validateSchema(parsed, schema);
  return parsed as T;
}

function validateReferences(ids: string[], validIds: Set<string>, path: string): void {
  if (!ids.length || ids.some(id => !validIds.has(id))) throw new Error(path + ' has missing or unknown source-span references');
}

function parseSourceOfTruth(text: string, spans: SourceSpan[]): SourceOfTruth {
  const sot = parseStructuredJson<SourceOfTruth>(text, sourceOfTruthSchema);
  if (!sot.summary.trim() || sot.coreFacts.some(fact => !fact.factId.trim() || !fact.statement.trim())) throw new Error('Gemini Source of Truth has empty required text');
  if (new Set(sot.coreFacts.map(fact => fact.factId)).size !== sot.coreFacts.length) throw new Error('Gemini returned duplicate fact IDs');
  const validIds = new Set(spans.map(span => span.id));
  sot.coreFacts.forEach(fact => validateReferences(fact.sourceSpans, validIds, 'coreFacts.sourceSpans'));
  sot.criticalMetrics.forEach(metric => validateReferences([metric.sourceSpan], validIds, 'criticalMetrics.sourceSpan'));
  return sot;
}

function parseOutputs(text: string, spans: SourceSpan[], selectedTypes: OutputType[]): { outputs: GeneratedOutput[] } {
  const parsed = parseStructuredJson<{ outputs: GeneratedOutput[] }>(text, generatedOutputsSchema);
  const expected = new Set(selectedTypes);
  if (parsed.outputs.length !== expected.size || new Set(parsed.outputs.map(output => output.outputType)).size !== expected.size ||
    parsed.outputs.some(output => !expected.has(output.outputType))) throw new Error('Gemini must return exactly one output for each requested format');
  const validIds = new Set(spans.map(span => span.id));
  for (const output of parsed.outputs) {
    if (!output.title.trim() || !output.content.trim()) throw new Error('Gemini output has empty required text');
    if (output.qualityScore != null && (output.qualityScore < 0 || output.qualityScore > 100)) throw new Error('Gemini output qualityScore must be between 0 and 100');
    if (output.groundedPercent != null && (output.groundedPercent < 0 || output.groundedPercent > 100)) throw new Error('Gemini output groundedPercent must be between 0 and 100');
    for (const claim of output.claims) {
      if (!claim.id.trim() || !claim.claimText.trim() || claim.outputType !== output.outputType) throw new Error('Gemini claim is incomplete or belongs to another format');
      validateReferences(claim.sourceSpanIds, validIds, 'claims.sourceSpanIds');
    }
  }
  return parsed;
}

function parseSingleOutput(
  text: string,
  spans: SourceSpan[],
  expectedType: OutputType
): GeneratedOutput {
  const parsed = parseStructuredJson<GeneratedOutput>(text, generatedOutputSchema);
  parsed.outputType = expectedType;
  if (!parsed.title?.trim() || !parsed.content?.trim()) {
    throw new Error(`Gemini ${expectedType} output has empty required text`);
  }
  const validIds = new Set(spans.map(span => span.id));
  for (const claim of parsed.claims || []) {
    claim.outputType = expectedType;
    validateReferences(claim.sourceSpanIds, validIds, 'claims.sourceSpanIds');
  }
  return parsed;
}

function getThematicImageUrl(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('cyber') || lower.includes('security') || lower.includes('vulnerability') || lower.includes('hack')) {
    return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('finance') || lower.includes('fintech') || lower.includes('payment') || lower.includes('money') || lower.includes('revenue')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('health') || lower.includes('hospital') || lower.includes('medical') || lower.includes('patient')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('self') || lower.includes('body') || lower.includes('mind') || lower.includes('philosophy') || lower.includes('consciousness')) {
    return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('startup') || lower.includes('investment') || lower.includes('venture') || lower.includes('market')) {
    return 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('education') || lower.includes('learn') || lower.includes('student') || lower.includes('school')) {
    return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('data') || lower.includes('cloud')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
}

export class GeminiPipelineService {
  private client: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null;
    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (e) {
        throw new Error('Failed to initialize Gemini: ' + sanitizedError(e, this.apiKey));
      }
    }
  }

  public hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Stage 1: Content Understanding & Source of Truth Extraction
   */
  async extractSourceOfTruth(rawText: string, spans: SourceSpan[]): Promise<SourceOfTruth> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured; no synthetic content returned.');
    }

    try {
      const indexedContent = spans.map(s => `[${s.id}] ${s.text}`).join('\n');
      const prompt = `You are the InfoMorph Content Understanding Engine.
Analyze the following source document where each sentence is tagged with a unique span ID ([S1], [S2], etc.).
Extract a rigorous, objective "Source of Truth" JSON representation:
1. A concise, articulate executive summary.
2. Core facts with exact source span IDs.
3. Named entities (Organizations, Vulnerabilities, Dates, Regulations, Concepts).
4. Critical numbers, dates, and metrics with exact values and source span references.

CRITICAL DATA HYGIENE:
- Filter out all document artifacts: page numbers ("Page X of Y", "2 of 28"), table of contents numbers, chapter titles on their own, footers, headers, and copyright notices.
- Extract ONLY genuine, complete factual statements that represent real knowledge from the text.
- Under criticalMetrics, include ONLY genuine quantitative figures with real units (%, $, hours, kg, users). NEVER output page numbers or list item numbers as metrics.

Return ONLY valid JSON:
{
  "summary": "string",
  "coreFacts": [{"factId": "F1", "statement": "string", "sourceSpans": ["S1"]}],
  "entities": [{"name": "string", "type": "string"}],
  "criticalMetrics": [{"label": "string", "value": "string", "sourceSpan": "S1"}]
}

Source Document:
${indexedContent}`;

      const { response } = await callGeminiWithModelFallback(this.client, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: sourceOfTruthSchema,
          temperature: 0.1
        }
      }, this.apiKey || '', text => { parseSourceOfTruth(text, spans); });

      return parseSourceOfTruth(response.text || '', spans);
    } catch (err) {
      const message = sanitizedError(err, this.apiKey || '');
      console.error('Gemini Source of Truth extraction failed: ' + message);
      throw new Error(message);
    }
  }

  /**
   * Stage 2: Specialized Single-Format Content Generation
   */
  async generateSingleFormatOutput(
    sot: SourceOfTruth,
    spans: SourceSpan[],
    config: QuestionnairePreferences,
    format: OutputType,
    trendSignals: TrendSignal[] = []
  ): Promise<OutputItem> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured; no synthetic content returned.');
    }

    const indexedContent = spans.map(s => `[${s.id}] ${s.text}`).join('\n');

    let platformInstructions = '';
    let hashtagGuidance = '';

    switch (format) {
      case 'instagram':
        platformInstructions = `Format strictly as a high-engagement Instagram Post:
- Opening: An irresistible single-line hook using the "${config.hookStyle || 'Statistic'}" style.
- Body: 3-4 clean, bulleted deep takeaways (derive complete, articulate sentences from Source of Truth).
- Closing: A thoughtful community question and clear call to action.
- Constraints: NEVER format as a carousel, NEVER mention "Carousel" or "Slide", and NEVER include document artifacts or page numbers.`;
        hashtagGuidance = `Generate between 5 and 8 targeted, highly relevant hashtags matching the topic and tone.`;
        break;

      case 'whatsapp':
        platformInstructions = `Format as a high-priority, executive WhatsApp Channel bulletin:
- Opening: Urgent/authoritative headline tagged with emoji, opening directly with a "${config.hookStyle || 'Statistic'}" hook.
- Body: Concise, high-density bulleted brief. Use *bold* for key terms and metrics. No markdown headers (# or ##).
- Closing: Clear next action or verification signoff.`;
        hashtagGuidance = `WhatsApp does not use hashtags naturally. Omit all hashtags (return empty array []).`;
        break;

      case 'linkedin':
        platformInstructions = `Format as an insightful LinkedIn Thought Leadership Post:
- Opening: A strong observation or perspective using the "${config.hookStyle || 'Statistic'}" style.
- Body: Structured narrative paragraphs with white space, breaking down strategic implications.
- Closing: Strategic discussion prompt for professionals.`;
        hashtagGuidance = `Generate between 2 and 3 professional, focused industry hashtags.`;
        break;

      case 'twitter':
        platformInstructions = `Format as a punchy, high-impact Post for X / Twitter:
- Opening: Direct, curiosity-inducing hook using the "${config.hookStyle || 'Statistic'}" style.
- Body: Crisp core finding with verified quantitative metrics.
- Closing: Engaging conclusion or discussion prompt.`;
        hashtagGuidance = `Generate exactly 1 or 2 high-relevance hashtags.`;
        break;

      case 'blog':
        platformInstructions = `Format as a well-structured authoritative Blog / Editorial Article:
- Title & Subtitle: Engaging and descriptive.
- Introduction: Sets up context and stakes with a "${config.hookStyle || 'Statistic'}" hook.
- Body: 2-3 logical sub-sections discussing core facts, evidence, and critical metrics.
- Conclusion: Forward-looking summary and implications.`;
        hashtagGuidance = `Blogs do not use social hashtags naturally. Return empty array [].`;
        break;

      case 'youtube':
        platformInstructions = `Format as an articulate YouTube Video Script Outline:
- Structure: Clear scene-by-scene script outline with visual description and narration.
- Opening: High-energy teaser using the "${config.hookStyle || 'Statistic'}" hook.
- Storyboard: Include 3-5 sequential scenes with narration and visual cues.`;
        hashtagGuidance = `Omit hashtags or provide up to 3 broad tags.`;
        break;
    }

    const voiceGuidance = config.voiceSample?.trim()
      ? `\nVOICE SAMPLE ADAPTATION:
Mirror the sentence rhythm, cadence, phrasing, and vocabulary density of this user voice sample:
"""
${config.voiceSample.trim()}
"""
CRITICAL: Do NOT copy facts, company names, or topics from the sample. Apply ONLY its stylistic rhythm and vocabulary patterns to the Source of Truth.`
      : '';

    const trendGuidance = trendSignals.length > 0
      ? `\nTREND CONTEXT SIGNALS (from search telemetry):
Related phrases: ${trendSignals.map(t => `"${t.phrase}"`).join(', ')}.
Use these phrases strictly for topical framing and hashtag selection. NEVER introduce ungrounded factual claims from search signals.`
      : '';

    const prompt = `You are the InfoMorph Content Intelligence Engine specializing in platform-native transformation.
Transform the provided Source of Truth into a ready-to-publish ${format.toUpperCase()} output.

CONFIGURATION:
- Target Audience: ${config.audience}
- Tone: ${config.tone}
- Language: ${config.language}
- Output Category: ${config.outputCategory}
- Objective: ${config.objective}
- Hook Style: ${config.hookStyle || 'Statistic'}

PLATFORM SPECIFICATIONS:
${platformInstructions}

HASHTAG RULES:
${hashtagGuidance}
${voiceGuidance}
${trendGuidance}

HUMAN WRITING GUIDANCE:
- Write naturally with varied sentence lengths (avoid monotonous rhythm).
- Avoid robotic endings, filler intros, and AI clichés like "delve", "game-changer", "let's dive in", or "in today's fast-paced world".
- Do not use unnecessary em dashes.
- Ground every factual assertion strictly in the Source of Truth.

Return valid JSON matching this schema:
{
  "outputType": "${format}",
  "title": "string",
  "subtitle": "string",
  "content": "string",
  "characterCount": 400,
  "claims": [{"id": "c1", "outputType": "${format}", "claimText": "string", "sourceSpanIds": ["S1"], "grounded": true, "contradictionFlag": false}],
  "hashtags": ["string"],
  "imageUrl": "string",
  "storyboard": [{"timestamp": "0:00 - 0:15", "title": "string", "visualDescription": "string", "narration": "string"}]
}

SOURCE OF TRUTH:
${JSON.stringify(sot)}

SOURCE EVIDENCE SPANS:
${indexedContent}`;

    const { response, model: modelUsed } = await callGeminiWithModelFallback(
      this.client,
      {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: generatedOutputSchema,
          temperature: 0.2
        }
      },
      this.apiKey || '',
      text => {
        parseSingleOutput(text, spans, format);
      }
    );

    const parsed = parseSingleOutput(response.text || '', spans, format);

    // Apply humanization to generated content
    let finalContent = humanizeText(parsed.content || '', format);
    let finalTitle = parsed.title;

    if (format === 'instagram') {
      finalTitle = 'Instagram Post';
      finalContent = finalContent
        .replace(/^Carousel:\s*/i, '')
        .replace(/Slide \d+:\s*/gi, '• ')
        .replace(/(?:Page|CHAPTER)\s+\d+(?:\s+of\s+\d+)?\.{0,3}/gi, '')
        .trim();
    }

    const defaultImg = getThematicImageUrl(sot.summary + ' ' + (sot.coreFacts[0]?.statement || ''));
    const isAudio = config.outputCategory === 'Audio';
    const isVideo = config.outputCategory === 'Video';

    const defaultStoryboardRaw = [
      {
        title: 'Scene 1: Executive Overview',
        visualDescription: 'Kinetic title sequence introducing the primary document headline.',
        narration: sot.summary
      },
      {
        title: 'Scene 2: Core Evidence & Grounded Findings',
        visualDescription: 'Animated highlight callouts emphasizing key source fact statements.',
        narration: sot.coreFacts.map(f => f.statement).join(' ') || sot.summary
      },
      {
        title: 'Scene 3: Quantitative Metrics & Analysis',
        visualDescription: 'Data cards highlighting verified metrics and operational shifts.',
        narration: sot.criticalMetrics.map(m => `Figure: ${m.value} for ${m.label}`).join('. ') || 'All metrics grounded.'
      },
      {
        title: 'Scene 4: Strategic Takeaways',
        visualDescription: 'High-impact conclusion card with InfoMorph verification seal.',
        narration: 'Canonical transformation verified against primary grounding references.'
      }
    ];

    const calculatedStoryboard = calculateStoryboardTimestamps(
      parsed.storyboard && parsed.storyboard.length > 0 ? parsed.storyboard : defaultStoryboardRaw
    );
    const calculatedAudioDuration = calculateAudioDuration(finalContent, 140);
    const calculatedVideoDuration =
      calculatedStoryboard[calculatedStoryboard.length - 1]?.timestamp.split(' - ')[1] || '1:15';

    return {
      ...parsed,
      id: `out-${format}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      outputType: format,
      title: finalTitle,
      content: finalContent,
      characterCount: finalContent.length,
      qualityScore: null,
      groundedPercent: null,
      isFallback: false,
      modelUsed,
      status: 'ready' as const,
      imageUrl: parsed.imageUrl || defaultImg,
      mediaType: isAudio ? 'audio' : isVideo || format === 'youtube' ? 'video' : 'post',
      audioDuration: calculatedAudioDuration,
      videoDuration: calculatedVideoDuration,
      storyboard: calculatedStoryboard,
      hashtags: parsed.hashtags || []
    };
  }

  /**
   * Stage 2: Parallel Coordinated Multi-Format Generation
   * Uses Promise.allSettled with concurrency limiting (2 concurrent requests) to protect quota.
   */
  async generateCoordinatedOutputs(
    sot: SourceOfTruth,
    spans: SourceSpan[],
    config: QuestionnairePreferences,
    selectedTypes: OutputType[]
  ): Promise<{
    outputs: OutputItem[];
    failedFormats: FailedFormatItem[];
  }> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured; no synthetic content returned.');
    }

    if (!selectedTypes || selectedTypes.length === 0) {
      return { outputs: [], failedFormats: [] };
    }

    // 1. Fetch trend signals once for the entire source topic (cached for 6 hours)
    let trendSignals: TrendSignal[] = [];
    try {
      const topic = sot.summary?.split('.')[0] || sot.entities?.[0]?.name || 'Technology';
      const trends = await getTopicTrendSignals(topic);
      trendSignals = trends.trendSignals || [];
    } catch (e) {
      console.warn('Trend lookup skipped: ' + sanitizedError(e, this.apiKey || ''));
    }

    // 2. Concurrency-limited execution pool (max 2 at a time) to prevent Gemini quota exhaustion
    const CONCURRENCY_LIMIT = 2;
    const settledResults: Array<{ format: OutputType; result: PromiseSettledResult<OutputItem> }> = [];

    let index = 0;
    const worker = async () => {
      while (index < selectedTypes.length) {
        const i = index++;
        const format = selectedTypes[i];
        try {
          const out = await this.generateSingleFormatOutput(sot, spans, config, format, trendSignals);
          settledResults.push({ format, result: { status: 'fulfilled', value: out } });
        } catch (err: any) {
          const cleanErr = sanitizedError(err, this.apiKey || '');
          console.warn(`Format ${format} generation attempt failed: ${cleanErr}`);
          settledResults.push({ format, result: { status: 'rejected', reason: new Error(cleanErr) } });
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, selectedTypes.length) },
      () => worker()
    );
    await Promise.all(workers);

    const outputs: OutputItem[] = [];
    const failedFormats: FailedFormatItem[] = [];

    for (const { format, result } of settledResults) {
      if (result.status === 'fulfilled') {
        outputs.push(result.value);
      } else {
        failedFormats.push({
          outputType: format,
          error: result.reason?.message || `Failed to generate ${format}`
        });
      }
    }

    // If all formats failed, throw explicit error
    if (outputs.length === 0 && failedFormats.length > 0) {
      throw new Error(`All requested format generations failed: ${failedFormats.map(f => `${f.outputType} (${f.error})`).join('; ')}`);
    }

    return {
      outputs,
      failedFormats
    };
  }

  /**
   * Stage 3: Verification
   * C1: Individual claim verification against cited source spans.
   * Runs in batches (one call per output).
   */
  async verifyOutputClaims(
    output: OutputItem,
    spans: SourceSpan[]
  ): Promise<ClaimItem[]> {
    if (!output.claims || output.claims.length === 0) {
      return [];
    }

    const spanMap = new Map<string, string>();
    for (const span of spans) {
      spanMap.set(span.id, span.text);
    }

    // Separate claims with valid cited evidence vs missing evidence
    const claimsNeedingVerification: Array<{ claim: ClaimItem; evidence: string }> = [];
    const instantResults: Map<string, Partial<ClaimItem>> = new Map();

    for (const claim of output.claims) {
      const citedTexts = (claim.sourceSpanIds || [])
        .map(id => spanMap.get(id))
        .filter((t): t is string => Boolean(t && t.trim()));

      if (citedTexts.length === 0) {
        // Zero relevant evidence -> unsupported
        instantResults.set(claim.id, {
          status: 'unsupported',
          grounded: false,
          explanation: 'No relevant source evidence was cited for this claim.',
          suggestedCorrection: 'Attach valid source citations or remove unsubstantiated statement.',
          sourceAmbiguity: false
        });
      } else {
        const evidenceStr = (claim.sourceSpanIds || [])
          .map(id => `[${id}]: "${spanMap.get(id) || ''}"`)
          .join('\n');
        claimsNeedingVerification.push({ claim, evidence: evidenceStr });
      }
    }

    if (claimsNeedingVerification.length === 0) {
      return output.claims.map(c => {
        const r = instantResults.get(c.id);
        return {
          ...c,
          status: r?.status || 'unsupported',
          grounded: r?.grounded ?? false,
          explanation: r?.explanation || '',
          suggestedCorrection: r?.suggestedCorrection,
          sourceAmbiguity: r?.sourceAmbiguity ?? false
        };
      });
    }

    if (!this.client) {
      throw new Error('Gemini API key is not configured; cannot perform real verification.');
    }

    const claimsPromptList = claimsNeedingVerification.map(({ claim, evidence }, idx) => {
      return `--- CLAIM ${idx + 1} ---
Claim ID: ${claim.id}
Claim Text: "${claim.claimText}"
Cited Source Evidence:
${evidence}`;
    }).join('\n\n');

    const prompt = `You are the InfoMorph Grounding Verification Engine.
Your task is to strictly verify whether each generated claim is factually grounded in its cited source evidence.

VERIFICATION RULES:
1. Evaluate FACTUAL MEANING, not just surface keyword matching.
2. NUMERICAL & QUANTITATIVE ACCURACY: If the claim asserts "500 students" but cited source says "5,000 students", it is UNSUPPORTED. Amounts, percentages, and metrics must match exactly.
3. DATES & DEADLINES: Verify exact day, month, and year. "Closes Friday" must align with the specific deadline cited.
4. ELIGIBILITY & CONDITIONS: Criteria must not be broadened, weakened, or removed.
5. SOURCE AMBIGUITY: If the source itself presents conflicting or ambiguous figures, set "sourceAmbiguity": true, "status": "partial" or "unsupported", and explain.
6. STATUS CRITERIA:
   - "supported": Fully substantiated by cited source evidence.
   - "partial": Partially substantiated, minor nuance lost, or slight overgeneralization.
   - "unsupported": Contradicts source, not supported by evidence, or asserts facts absent from cited text.
7. For any "partial" or "unsupported" claim, provide a clear, factual explanation and a concrete suggestedCorrection.

CLAIMS TO VERIFY:
${claimsPromptList}

Return ONLY valid JSON matching this schema:
{
  "verifiedClaims": [
    {
      "id": "string (matching Claim ID)",
      "status": "supported" | "partial" | "unsupported",
      "explanation": "string concise factual justification",
      "suggestedCorrection": "string concrete correction if needed, or empty string",
      "sourceAmbiguity": boolean
    }
  ]
}`;

    const { response } = await callGeminiWithModelFallback(
      this.client,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      },
      this.apiKey || '',
      text => {
        parseStructuredJson(text, verifiedClaimsSchema);
      }
    );

    const parsed = parseStructuredJson<{
      verifiedClaims: Array<{
        id: string;
        status: 'supported' | 'partial' | 'unsupported';
        explanation: string;
        suggestedCorrection?: string;
        sourceAmbiguity?: boolean;
      }>;
    }>(response.text || '', verifiedClaimsSchema);

    const verifiedMap = new Map(parsed.verifiedClaims.map(v => [v.id, v]));

    return output.claims.map(c => {
      const instant = instantResults.get(c.id);
      if (instant) {
        return {
          ...c,
          status: instant.status || 'unsupported',
          grounded: instant.grounded ?? false,
          explanation: instant.explanation || '',
          suggestedCorrection: instant.suggestedCorrection,
          sourceAmbiguity: instant.sourceAmbiguity ?? false
        };
      }

      const verified = verifiedMap.get(c.id);
      if (!verified) {
        return {
          ...c,
          status: 'unsupported' as const,
          grounded: false,
          explanation: 'Claim verification could not be confirmed by model.',
          sourceAmbiguity: false
        };
      }

      return {
        ...c,
        status: verified.status,
        grounded: verified.status === 'supported',
        explanation: verified.explanation,
        suggestedCorrection: verified.suggestedCorrection || undefined,
        sourceAmbiguity: Boolean(verified.sourceAmbiguity)
      };
    });
  }

  /**
   * C2: Cross-output consistency verification across all generated outputs.
   */
  async verifyCrossOutputConsistency(outputs: OutputItem[]): Promise<ContradictionItem[]> {
    if (!outputs || outputs.length < 2) {
      return [];
    }

    if (!this.client) {
      throw new Error('Gemini API key is not configured; cannot perform cross-output consistency check.');
    }

    const summaries = outputs.map(o => {
      const claimsStr = (o.claims || []).map(c => `  - [${c.id}] ${c.claimText}`).join('\n');
      return `Channel: ${o.outputType.toUpperCase()} (Title: "${o.title}")\nContent: "${o.content.substring(0, 500)}..."\nClaims:\n${claimsStr}`;
    }).join('\n\n');

    const prompt = `You are the InfoMorph Cross-Output Consistency Engine.
Compare factual statements across these generated channel outputs for the same primary source.

INCONSISTENCY DETECTION RULES:
1. Detect genuine factual inconsistencies between channels regarding:
   - Dates & deadlines
   - Numbers, metrics, and percentages
   - Monetary amounts and budgets
   - Eligibility conditions and requirements
   - Locations and event details
2. IMPORTANT: Differences in tone, brevity, hashtags, formatting, or platform style are NOT contradictions.
3. Only report ACTUAL FACTUAL INCONSISTENCIES where one channel claims fact X and another channel claims incompatible fact Y.
4. For each contradiction found, determine severity:
   - 'high': Direct numerical, date, or factual contradiction (e.g., 500 vs 5,000 students, different deadlines).
   - 'medium': Substantial discrepancy in eligibility or scope.
   - 'low': Minor factual variance or ambiguity across outputs.

CHANNELS AND CLAIMS:
${summaries}

Return ONLY valid JSON matching this schema:
{
  "contradictions": [
    {
      "topic": "string (e.g., Application Deadline)",
      "severity": "high" | "medium" | "low",
      "description": "string describing the contradiction",
      "outputAType": "instagram" | "youtube" | "linkedin" | "blog" | "whatsapp" | "twitter",
      "outputAText": "string quote from output A",
      "outputBType": "instagram" | "youtube" | "linkedin" | "blog" | "whatsapp" | "twitter",
      "outputBText": "string quote from output B",
      "suggestedFix": "string recommended resolution"
    }
  ]
}`;

    const { response } = await callGeminiWithModelFallback(
      this.client,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      },
      this.apiKey || '',
      text => {
        parseStructuredJson(text, crossConsistencySchema);
      }
    );

    const parsed = parseStructuredJson<{
      contradictions: Array<{
        topic: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        outputAType: OutputType;
        outputAText: string;
        outputBType: OutputType;
        outputBText: string;
        suggestedFix: string;
      }>;
    }>(response.text || '', crossConsistencySchema);

    return parsed.contradictions.map((c, idx) => ({
      id: `contra-${Date.now()}-${idx}`,
      topic: c.topic,
      severity: c.severity,
      description: c.description,
      outputA: { type: c.outputAType, text: c.outputAText },
      outputB: { type: c.outputBType, text: c.outputBText },
      suggestedFix: c.suggestedFix,
      resolved: false
    }));
  }

  /**
   * C3: Grounding and consistency verification orchestrator with real deterministic scoring.
   */
  async verifyGroundednessAndConsistency(
    sot: SourceOfTruth,
    spans: SourceSpan[],
    outputs: OutputItem[]
  ): Promise<{
    verification: VerificationResult;
    verifiedOutputs: OutputItem[];
  }> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured; cannot perform verification.');
    }

    // 1. Verify claims for each output in batch
    const verifiedOutputs: OutputItem[] = [];
    for (const output of outputs) {
      const verifiedClaims = await this.verifyOutputClaims(output, spans);

      const outputTotal = verifiedClaims.length;
      const outputSupported = verifiedClaims.filter(c => c.status === 'supported').length;
      const outputGroundingPercent = outputTotal > 0
        ? Math.round((outputSupported / outputTotal) * 100)
        : null;

      verifiedOutputs.push({
        ...output,
        claims: verifiedClaims,
        groundedPercent: outputGroundingPercent,
        qualityScore: outputGroundingPercent
      });
    }

    // 2. Cross-output consistency check
    let contradictions: ContradictionItem[] = [];
    if (outputs.length >= 2) {
      try {
        contradictions = await this.verifyCrossOutputConsistency(verifiedOutputs);
      } catch (err) {
        console.warn('Cross-output consistency check warning: ' + sanitizedError(err, this.apiKey || ''));
        contradictions = [];
      }
    }

    // Mark contradiction flags on matching claims
    for (const contra of contradictions) {
      for (const vo of verifiedOutputs) {
        if (vo.outputType === contra.outputA.type || vo.outputType === contra.outputB.type) {
          for (const cl of vo.claims) {
            if (
              cl.claimText.toLowerCase().includes(contra.topic.toLowerCase()) ||
              contra.description.toLowerCase().includes(cl.claimText.toLowerCase())
            ) {
              cl.contradictionFlag = true;
              cl.contradictionDetails = contra.description;
            }
          }
        }
      }
    }

    // 3. Deterministic scoring
    const allClaims = verifiedOutputs.flatMap(o => o.claims || []);
    const totalClaimsCount = allClaims.length;
    const groundedClaimsCount = allClaims.filter(c => c.status === 'supported').length;
    const partialClaimsCount = allClaims.filter(c => c.status === 'partial').length;
    const unsupportedClaimsCount = allClaims.filter(c => c.status === 'unsupported').length;

    let groundingRate: number | null = null;
    let status: 'verified' | 'unverified' | 'insufficient_evidence' = 'verified';

    if (totalClaimsCount === 0) {
      status = 'insufficient_evidence';
      groundingRate = null;
    } else {
      // Deterministic formula:
      // groundingRate = supported claims / all assessed factual claims * 100
      groundingRate = Math.round((groundedClaimsCount / totalClaimsCount) * 100);
    }

    let overallConsistencyScore: number | null = null;
    if (outputs.length < 2) {
      // For single-output cases, cross-output consistency is not applicable (null)
      overallConsistencyScore = null;
    } else {
      const highCount = contradictions.filter(c => c.severity === 'high').length;
      const medCount = contradictions.filter(c => c.severity === 'medium').length;
      const lowCount = contradictions.filter(c => c.severity === 'low').length;
      const penalty = (highCount * 25) + (medCount * 15) + (lowCount * 5);
      overallConsistencyScore = Math.max(0, 100 - penalty);
    }

    const verification: VerificationResult = {
      overallConsistencyScore,
      groundingRate,
      groundedClaimsCount,
      partialClaimsCount,
      unsupportedClaimsCount,
      totalClaimsCount,
      contradictions,
      verifiedAt: new Date().toISOString(),
      status
    };

    return {
      verification,
      verifiedOutputs
    };
  }
}
