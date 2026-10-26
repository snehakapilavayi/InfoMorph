import dns from 'node:dns/promises';
import { sanitizeSecretOutput } from './env';

/**
 * Result of URL fetching and article extraction.
 */
export interface ExtractedUrlContent {
  url: string;
  finalUrl: string;
  title: string;
  text: string;
  wordCount: number;
}

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds
const MAX_REDIRECTS = 5;
const MIN_ARTICLE_WORDS = 200;

/**
 * Checks whether an IPv4 address is in a private, loopback, link-local,
 * or reserved range that should not be reached via SSRF.
 */
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata service 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is in a private, loopback, link-local,
 * or reserved range.
 */
function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1) and unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.startsWith('::ffff:') && normalized.includes('.')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    return isPrivateOrReservedIPv4(ipv4Part);
  }

  // Unique local addresses (fc00::/7 -> fc.. or fd..)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local unicast (fe80::/10 -> fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(normalized)) return true;

  // Documentation (2001:db8::/32)
  if (normalized.startsWith('2001:db8') || normalized.startsWith('2001:0db8')) return true;

  // Discard prefix (100::/64)
  if (normalized.startsWith('100:')) return true;

  return false;
}

/**
 * Validates a parsed URL against protocol and SSRF constraints.
 */
export async function validatePublicUrl(targetUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported URL scheme. Only HTTP and HTTPS are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject local and internal hostnames directly
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    throw new Error('Requests to localhost or internal network destinations are blocked.');
  }

  // Check if hostname is already a raw IPv4 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    if (isPrivateOrReservedIPv4(hostname)) {
      throw new Error(`Requests to private or reserved IP address (${hostname}) are blocked.`);
    }
  }

  // Resolve hostname via DNS and check all resolved IPs
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error(`Unable to resolve hostname: ${hostname}`);
    }

    for (const addr of addresses) {
      if (addr.family === 4) {
        if (isPrivateOrReservedIPv4(addr.address)) {
          throw new Error(`Host resolves to a private or internal network IP (${addr.address}), request blocked.`);
        }
      } else if (addr.family === 6) {
        if (isPrivateOrReservedIPv6(addr.address)) {
          throw new Error(`Host resolves to a private or internal IPv6 address (${addr.address}), request blocked.`);
        }
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('blocked')) {
      throw err;
    }
    throw new Error(`DNS lookup failed for ${hostname}: ${err.message || 'Host not found'}`);
  }

  return parsed;
}

/**
 * Strips HTML tags, navigation, headers, footers, scripts, and extracts clean article text.
 */
export function extractCleanArticleText(html: string): { title: string; text: string; wordCount: number } {
  if (!html || !html.trim()) {
    return { title: '', text: '', wordCount: 0 };
  }

  // Extract title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  let cleaned = html;

  // 1. Remove scripts, styles, noscript, svg, audio, video, canvas, iframes
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
  cleaned = cleaned.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ' ');

  // 2. Remove navigational, chrome, header, footer, sidebar, and form tags
  cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
  cleaned = cleaned.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');
  cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  cleaned = cleaned.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');
  cleaned = cleaned.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, ' ');

  // 3. Remove common cookie banners, disclaimers, modals based on attributes
  cleaned = cleaned.replace(/<div[^>]+(class|id)=["'][^"']*(cookie|banner|consent|modal|popup|advert|dialog)[^"']*["'][^<]*(?:(?!<\/div>)<[^<]*)*<\/div>/gi, ' ');

  // 4. Preserve headings as section titles
  cleaned = cleaned.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n$1\n\n');

  // 5. Convert block elements to clean line breaks
  cleaned = cleaned.replace(/<\/(p|div|section|article|li|tr|blockquote)>/gi, '\n\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // 6. Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // 7. Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // 8. Normalize whitespace and clean lines
  const lines = cleaned
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(line => line.length > 0);

  const text = lines.join('\n\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    title,
    text,
    wordCount
  };
}

/**
 * Basic HTML entity decoding without heavy DOM dependencies.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

/**
 * Securely fetches a public URL following redirects with SSRF re-checks,
 * validates size & timeout, and extracts clean article text.
 */
export async function fetchAndExtractUrlContent(initialUrl: string): Promise<ExtractedUrlContent> {
  let currentUrl = initialUrl.trim();
  let redirectsRemaining = MAX_REDIRECTS;

  while (redirectsRemaining >= 0) {
    const validated = await validatePublicUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(validated.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) InfoMorphContentIngester/1.0 (+https://infomorph.ai)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7'
        },
        redirect: 'manual',
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${FETCH_TIMEOUT_MS / 1000}s while fetching URL`);
      }
      throw new Error(`Failed to fetch URL: ${sanitizeSecretOutput(err.message)}`);
    } finally {
      clearTimeout(timeout);
    }

    // Handle 3xx redirects manually to enforce SSRF validation at every step
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error(`Redirect response (${res.status}) missing Location header`);
      }

      // Resolve relative redirect against current URL
      const nextUrl = new URL(location, validated).toString();
      currentUrl = nextUrl;
      redirectsRemaining--;

      if (redirectsRemaining < 0) {
        throw new Error(`Too many redirects (exceeded limit of ${MAX_REDIRECTS})`);
      }
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText || 'Failed to retrieve page'}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Unsupported content type (${contentType}). Only HTML and plain text web pages are supported.`);
    }

    // Read response with size limit
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Response body is unreadable');
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > MAX_RESPONSE_BYTES) {
          reader.cancel();
          throw new Error(`Page content exceeds maximum allowed size of ${MAX_RESPONSE_BYTES / (1024 * 1024)}MB`);
        }
        chunks.push(value);
      }
    }

    const totalBuffer = Buffer.concat(chunks);
    const htmlText = totalBuffer.toString('utf-8');

    // Extract text content
    const extracted = extractCleanArticleText(htmlText);

    if (!extracted.text || extracted.wordCount < MIN_ARTICLE_WORDS) {
      const error: any = new Error('Source is too short or unreadable');
      error.statusCode = 400;
      error.wordCount = extracted.wordCount;
      throw error;
    }

    return {
      url: initialUrl,
      finalUrl: currentUrl,
      title: extracted.title || validated.hostname,
      text: extracted.text,
      wordCount: extracted.wordCount
    };
  }

  throw new Error('Redirect loop detected');
}
