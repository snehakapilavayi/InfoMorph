import { NextRequest, NextResponse } from 'next/server';
import { fetchAndExtractUrlContent } from '@/lib/urlFetch';
import { cleanRawDocumentText } from '@/lib/tokenizer';
import { sanitizeSecretOutput } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 });
    }

    const result = await fetchAndExtractUrlContent(url.trim());
    const cleanedText = cleanRawDocumentText(result.text);

    return NextResponse.json({
      url: result.url,
      finalUrl: result.finalUrl,
      title: result.title,
      text: cleanedText || result.text,
      wordCount: result.wordCount
    });
  } catch (error: any) {
    const status = error.statusCode || (error.message?.includes('Source is too short') ? 400 : 500);
    const message = sanitizeSecretOutput(error.message || 'Failed to extract content from URL');
    return NextResponse.json(
      { error: message, wordCount: error.wordCount },
      { status }
    );
  }
}
