import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { tokenizeTextIntoSpans } from '@/lib/tokenizer';

export async function POST(req: NextRequest) {
  try {
    const { rawText, apiKey } = await req.json();

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'Source text is required' }, { status: 400 });
    }

    const spans = tokenizeTextIntoSpans(rawText);
    const service = new GeminiPipelineService(apiKey);
    const sot = await service.extractSourceOfTruth(rawText, spans);

    return NextResponse.json({
      spans,
      sot,
      wordCount: rawText.split(/\s+/).filter(Boolean).length
    });
  } catch (error: any) {
    console.error('Understand route error:', error);
    return NextResponse.json(
      { error: 'Failed to process source text', details: error.message },
      { status: 500 }
    );
  }
}
