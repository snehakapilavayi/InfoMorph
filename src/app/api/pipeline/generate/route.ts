import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { OutputType, SourceOfTruth, TransformConfig, SourceSpan } from '@/types';
import { getGeminiApiKey, sanitizeSecretOutput } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { sot, spans, config, selectedTypes, singleFormat } = await req.json();
    const typesToGenerate = singleFormat ? [singleFormat as OutputType] : (selectedTypes as OutputType[]);
    if (!sot || !typesToGenerate || typesToGenerate.length === 0) {
      return NextResponse.json({ error: 'Source of Truth and at least one format are required' }, { status: 400 });
    }

    const geminiApiKey = getGeminiApiKey();
    const service = new GeminiPipelineService(geminiApiKey);
    const result = await service.generateCoordinatedOutputs(
      sot as SourceOfTruth,
      (spans || []) as SourceSpan[],
      config,
      typesToGenerate
    );

    return NextResponse.json({
      outputs: result.outputs,
      failedFormats: result.failedFormats
    });
  } catch (error: any) {
    const cleanMessage = sanitizeSecretOutput(error.message || 'Failed to generate coordinated outputs');
    console.error('Generate route error:', cleanMessage);
    return NextResponse.json(
      { error: cleanMessage },
      { status: 500 }
    );
  }
}
