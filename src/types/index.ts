export type OutputType =
  | 'instagram'
  | 'youtube'
  | 'linkedin'
  | 'blog'
  | 'whatsapp'
  | 'twitter';

export type NavSection =
  | 'new_chat'
  | 'preferences'
  | 'outputs'
  | 'sources'
  | 'publish'
  | 'projects';

export interface SourceSpan {
  id: string; // e.g. 'S1', 'S2'
  text: string;
  index: number;
}

export interface SourceCorpusItem {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'csv' | 'txt' | 'url';
  size: string;
  pages: number | string;
  uploadedAt: string;
  isPrimary: boolean;
  rawText: string;
  spans?: SourceSpan[];
}

export interface FactItem {
  factId: string;
  statement: string;
  sourceSpans: string[];
}

export interface EntityItem {
  name: string;
  type: string;
}

export interface MetricItem {
  label: string;
  value: string;
  sourceSpan: string;
}

export interface SourceOfTruth {
  summary: string;
  coreFacts: FactItem[];
  entities: EntityItem[];
  criticalMetrics: MetricItem[];
}

export interface QuestionnairePreferences {
  audience: string;
  tone: string;
  language: string;
  outputCategory: string; // 'Post' | 'Audio' | 'Video'
  objective: string;
  selectedFormats: OutputType[];
  hookStyle?: 'Question' | 'Statistic' | 'Story' | 'Myth-busting' | string;
  voiceSample?: string;
}

export interface TrendSignal {
  phrase: string;
  source: string;
}

export interface FailedFormatItem {
  outputType: OutputType;
  error: string;
}

// Alias for backwards compatibility with API routes
export type TransformConfig = QuestionnairePreferences;

export interface ClaimItem {
  id: string;
  outputType: OutputType;
  claimText: string;
  sourceSpanIds: string[];
  grounded: boolean;
  contradictionFlag: boolean;
  contradictionDetails?: string;
  status?: 'supported' | 'partial' | 'unsupported';
  explanation?: string;
  suggestedCorrection?: string;
  sourceAmbiguity?: boolean;
}

export interface ContradictionItem {
  id: string;
  topic: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  outputA: { type: OutputType; text: string; spanId?: string };
  outputB: { type: OutputType; text: string; spanId?: string };
  suggestedFix: string;
  resolved: boolean;
}

export interface VerificationResult {
  overallConsistencyScore?: number | null;
  groundingRate?: number | null;
  groundedClaimsCount: number;
  partialClaimsCount?: number;
  unsupportedClaimsCount?: number;
  totalClaimsCount: number;
  contradictions: ContradictionItem[];
  verifiedAt: string;
  status?: 'verified' | 'unverified' | 'insufficient_evidence' | 'error';
  errorMessage?: string;
}

export interface StoryboardScene {
  timestamp: string;
  title: string;
  visualDescription: string;
  narration: string;
}

export interface OutputItem {
  id: string;
  outputType: OutputType;
  title: string;
  subtitle: string;
  content: string;
  qualityScore?: number | null;
  characterCount: number;
  groundedPercent?: number | null;
  status: 'ready' | 'published' | 'draft' | 'under_review';
  publishedAt?: string;
  claims: ClaimItem[];
  hashtags?: string[];
  metadata?: Record<string, any>;
  imageUrl?: string;
  mediaType?: 'post' | 'audio' | 'video';
  audioDuration?: string;
  videoDuration?: string;
  storyboard?: StoryboardScene[];
  isFallback?: boolean;
  fallbackReason?: string;
  modelUsed?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  primarySource: string;
  outputsCount: number;
  qualityScore?: number | null;
  lastUpdated: string;
  status: 'Completed' | 'In Progress' | 'Draft';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  category: 'ingestion' | 'understanding' | 'generation' | 'verification' | 'review' | 'publish';
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning' | 'error';
}
