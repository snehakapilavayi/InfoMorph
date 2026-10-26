import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { tokenizeTextIntoSpans, cleanRawDocumentText } from '@/lib/tokenizer';
import { getGeminiApiKey, sanitizeSecretOutput } from '@/lib/env';
import { fetchAndExtractUrlContent } from '@/lib/urlFetch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let rawText: string = body.rawText || '';
    const inputUrl: string | undefined = body.url;
    let sourceUrl: string | null = null;
    let detectedTitle: string | null = null;

    // Check if input is a URL or if rawText itself is solely an HTTP(S) URL
    const isSoleUrl = (text: string) => /^https?:\/\/[^\s]+$/i.test(text.trim());

    if (inputUrl && inputUrl.trim()) {
      sourceUrl = inputUrl.trim();
      const extracted = await fetchAndExtractUrlContent(sourceUrl);
      rawText = cleanRawDocumentText(extracted.text);
      detectedTitle = extracted.title;
    } else if (rawText && isSoleUrl(rawText)) {
      sourceUrl = rawText.trim();
      const extracted = await fetchAndExtractUrlContent(sourceUrl);
      rawText = cleanRawDocumentText(extracted.text);
      detectedTitle = extracted.title;
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'Source text or valid URL is required' }, { status: 400 });
    }

    const geminiApiKey = getGeminiApiKey();
    const spans = tokenizeTextIntoSpans(rawText);
    const service = new GeminiPipelineService(geminiApiKey);
    const sot = await service.extractSourceOfTruth(rawText, spans);

    return NextResponse.json({
      spans,
      sot,
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
      sourceUrl,
      title: detectedTitle
    });
  } catch (error: any) {
    const isClientError = error.statusCode === 400 || error.message?.includes('Source is too short or unreadable');
    const status = isClientError ? 400 : 500;
    const cleanMessage = sanitizeSecretOutput(error.message || 'Failed to process source text');

    console.error('Understand route error:', cleanMessage);
    return NextResponse.json(
      { error: cleanMessage },
      { status }
    );
  }
}
