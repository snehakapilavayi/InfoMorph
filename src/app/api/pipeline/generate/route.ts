import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { OutputType, SourceOfTruth, TransformConfig, SourceSpan } from '@/types';
import { getGeminiApiKey, sanitizeSecretOutput } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { sot, spans, config, selectedTypes } = await req.json();

    if (!sot || !selectedTypes || selectedTypes.length === 0) {
      return NextResponse.json({ error: 'Source of Truth and selected output types are required' }, { status: 400 });
    }

    const geminiApiKey = getGeminiApiKey();
    const service = new GeminiPipelineService(geminiApiKey);
    const outputs = await service.generateCoordinatedOutputs(
      sot as SourceOfTruth,
      (spans || []) as SourceSpan[],
      config as TransformConfig,
      selectedTypes as OutputType[]
    );

    return NextResponse.json({ outputs });
  } catch (error: any) {
    const cleanMessage = sanitizeSecretOutput(error.message || 'Failed to generate coordinated outputs');
    console.error('Generate route error:', cleanMessage);
    return NextResponse.json(
      { error: cleanMessage },
      { status: 500 }
    );
  }
}
