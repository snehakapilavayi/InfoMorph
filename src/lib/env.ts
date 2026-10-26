/**
 * Server-side Environment Configuration System
 * 
 * Centralizes access to environment variables across InfoMorph.
 * Ensures API keys and credentials are never leaked to client bundles,
 * error messages, or logs.
 */

// Client-side execution guard
if (typeof window !== 'undefined') {
  throw new Error('src/lib/env.ts is server-only and cannot be imported on the client.');
}

/**
 * Sanitizes any string to remove occurrences of sensitive secrets.
 */
export function sanitizeSecretOutput(text: string): string {
  if (!text) return '';
  let sanitized = String(text);
  const secrets = [
    process.env.GEMINI_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.YOUTUBE_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ...Object.entries(process.env)
      .filter(([name]) => /KEY|TOKEN|SECRET|PASSWORD|AUTHORIZATION/i.test(name))
      .map(([, val]) => val || '')
  ].filter((s): s is string => Boolean(s && s.length >= 4));

  for (const secret of secrets) {
    sanitized = sanitized.split(secret).join('[REDACTED]');
  }

  return sanitized
    .replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED]')
    .replace(/sk-[0-9A-Za-z-_]{20,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:api[_-]?key|token|secret|password)["']?\s*[:=]\s*)[^\r\n,}]+/gi, '$1[REDACTED]');
}

/**
 * Retrieves the required Gemini API Key. Throws an explicit error if missing.
 */
export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add it to your .env.local file.');
  }
  return key.trim();
}

/**
 * Checks whether the Gemini API key is configured without exposing it.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

/**
 * Retrieves the Supabase configuration parameters.
 */
export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string | null;
  isConfigured: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey)
  };
}

/**
 * Retrieves optional API keys safely.
 */
export function getOptionalApiKey(service: 'youtube' | 'openai'): string | null {
  if (service === 'youtube') {
    const key = process.env.YOUTUBE_API_KEY?.trim();
    return key || null;
  }
  if (service === 'openai') {
    const key = process.env.OPENAI_API_KEY?.trim();
    return key || null;
  }
  return null;
}

/**
 * Safe status summary for health reporting. Never exposes credentials.
 */
export function getServiceConfigurationStatus() {
  const supabase = getSupabaseConfig();
  return {
    gemini: {
      configured: isGeminiConfigured(),
      required: true,
      description: 'AI Multi-modal Transformation & Grounding'
    },
    supabase: {
      configured: supabase.isConfigured,
      hasServiceRoleKey: Boolean(supabase.serviceRoleKey),
      required: true,
      description: 'Relational Persistence & Audit Logs'
    },
    youtube: {
      configured: Boolean(getOptionalApiKey('youtube')),
      required: false,
      description: 'Optional Video Publishing & Analytics'
    },
    openai: {
      configured: Boolean(getOptionalApiKey('openai')),
      required: false,
      description: 'Optional Cross-Model Benchmark Validation'
    }
  };
}
