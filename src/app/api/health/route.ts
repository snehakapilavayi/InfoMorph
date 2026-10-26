import { NextResponse } from 'next/server';
import { getServiceConfigurationStatus, isGeminiConfigured, getSupabaseConfig } from '@/lib/env';

export async function GET() {
  const configStatus = getServiceConfigurationStatus();
  const supabase = getSupabaseConfig();

  // Basic connectivity checks for configured services
  let supabaseConnectionVerified = false;
  let supabaseError: string | null = null;

  if (supabase.isConfigured) {
    try {
      // Perform lightweight reachability check against Supabase REST endpoint
      const res = await fetch(`${supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`
        },
        signal: AbortSignal.timeout(4000)
      });
      supabaseConnectionVerified = res.status < 500;
    } catch (err: any) {
      supabaseConnectionVerified = false;
      supabaseError = 'Host unreachable or timeout';
    }
  }

  const geminiConfigured = isGeminiConfigured();

  const responseBody = {
    status: geminiConfigured ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      gemini: {
        configured: configStatus.gemini.configured,
        required: true,
        connectionVerified: geminiConfigured ? 'available_on_demand' : 'not_configured',
        note: 'Gemini connects per-pipeline call with model fallback.'
      },
      supabase: {
        configured: configStatus.supabase.configured,
        required: true,
        connectionVerified: supabaseConnectionVerified,
        error: supabaseError
      },
      youtube: {
        configured: configStatus.youtube.configured,
        required: false,
        connectionVerified: configStatus.youtube.configured ? 'configured_unverified' : 'not_configured'
      },
      openai: {
        configured: configStatus.openai.configured,
        required: false,
        connectionVerified: configStatus.openai.configured ? 'configured_unverified' : 'not_configured'
      }
    }
  };

  return NextResponse.json(responseBody, {
    status: geminiConfigured ? 200 : 503
  });
}
