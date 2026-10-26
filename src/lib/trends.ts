import { getOptionalApiKey, sanitizeSecretOutput } from '@/lib/env';
import { TrendSignal } from '@/types';

interface CachedTrendData {
  timestamp: number;
  signals: TrendSignal[];
}

// 6-hour in-memory cache: 6 * 60 * 60 * 1000 ms
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const trendCache = new Map<string, CachedTrendData>();

/**
 * Extracts clean, meaningful key phrases from YouTube video titles and descriptions.
 * Avoids inventing metrics, view counts, or rankings.
 */
function extractPhrasesFromYouTubeItems(items: any[]): TrendSignal[] {
  const phrases = new Set<string>();

  for (const item of items) {
    const title = item.snippet?.title || '';
    const desc = item.snippet?.description || '';

    // Clean title from common YouTube clickbait/brackets
    const cleanTitle = title
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/[|•–—].*$/, '')
      .trim();

    if (cleanTitle.length >= 8 && cleanTitle.length <= 60) {
      phrases.add(cleanTitle);
    }

    // Extract hashtags if present in description
    const hashtagMatches = desc.match(/#([a-zA-Z0-9_]{3,25})/g);
    if (hashtagMatches) {
      for (const tag of hashtagMatches.slice(0, 3)) {
        phrases.add(tag);
      }
    }
  }

  return Array.from(phrases).slice(0, 8).map(phrase => ({
    phrase,
    source: 'youtube_search_snippet'
  }));
}

/**
 * Fetches trend signals for a given topic with a 6-hour cache.
 * When YOUTUBE_API_KEY is not configured or fails, gracefully falls back without throwing.
 */
export async function getTopicTrendSignals(topic: string): Promise<{
  trendSignals: TrendSignal[];
  hasLiveTrends: boolean;
  cached: boolean;
  source: string;
}> {
  const normalizedTopic = topic.trim().toLowerCase();
  if (!normalizedTopic) {
    return { trendSignals: [], hasLiveTrends: false, cached: false, source: 'none' };
  }

  // 1. Check 6-hour cache
  const cached = trendCache.get(normalizedTopic);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      trendSignals: cached.signals,
      hasLiveTrends: true,
      cached: true,
      source: 'youtube_cache_6h'
    };
  }

  // 2. Check for optional YouTube API key
  const youtubeApiKey = getOptionalApiKey('youtube');
  if (!youtubeApiKey) {
    const fallbackWords = normalizedTopic.split(/\s+/).filter(w => w.length > 3);
    const fallbackSignals: TrendSignal[] = fallbackWords.slice(0, 4).map(w => ({
      phrase: `#${w.replace(/[^\w]/g, '')}`,
      source: 'topic_keyword_fallback'
    }));

    trendCache.set(normalizedTopic, {
      timestamp: Date.now(),
      signals: fallbackSignals
    });

    return {
      trendSignals: fallbackSignals,
      hasLiveTrends: false,
      cached: false,
      source: 'unconfigured_fallback'
    };
  }

  // 3. Query YouTube Data API v3 search endpoint
  try {
    const query = encodeURIComponent(topic.substring(0, 80));
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=5&key=${youtubeApiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`YouTube API returned HTTP ${res.status}; skipping live trends gracefully.`);
      const fallbackWords = normalizedTopic.split(/\s+/).filter(w => w.length > 3);
      const fallbackSignals: TrendSignal[] = fallbackWords.slice(0, 4).map(w => ({
        phrase: `#${w.replace(/[^\w]/g, '')}`,
        source: 'topic_keyword_fallback'
      }));

      trendCache.set(normalizedTopic, {
        timestamp: Date.now(),
        signals: fallbackSignals
      });

      return {
        trendSignals: fallbackSignals,
        hasLiveTrends: false,
        cached: false,
        source: `youtube_api_error_${res.status}`
      };
    }

    const data = await res.json();
    const items = data.items || [];
    const signals = extractPhrasesFromYouTubeItems(items);

    // Save to 6-hour cache
    trendCache.set(normalizedTopic, {
      timestamp: Date.now(),
      signals
    });

    return {
      trendSignals: signals,
      hasLiveTrends: signals.length > 0,
      cached: false,
      source: 'youtube_data_api_v3'
    };
  } catch (err: any) {
    console.warn('YouTube trend lookup warning: ' + sanitizeSecretOutput(err.message));
    const fallbackWords = normalizedTopic.split(/\s+/).filter(w => w.length > 3);
    const fallbackSignals: TrendSignal[] = fallbackWords.slice(0, 4).map(w => ({
      phrase: `#${w.replace(/[^\w]/g, '')}`,
      source: 'topic_keyword_fallback'
    }));

    trendCache.set(normalizedTopic, {
      timestamp: Date.now(),
      signals: fallbackSignals
    });

    return {
      trendSignals: fallbackSignals,
      hasLiveTrends: false,
      cached: false,
      source: 'error_fallback'
    };
  }
}

/**
 * Testing utility to clear in-memory trend cache.
 */
export function clearTrendCacheForTesting(): void {
  trendCache.clear();
}
