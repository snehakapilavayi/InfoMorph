import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { OutputType, SourceOfTruth, TransformConfig, SourceSpan } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { sot, spans, config, selectedTypes, apiKey } = await req.json();

    if (!sot || !selectedTypes || selectedTypes.length === 0) {
      return NextResponse.json({ error: 'Source of Truth and selected output types are required' }, { status: 400 });
    }

    const service = new GeminiPipelineService(apiKey);
    const outputs = await service.generateCoordinatedOutputs(
      sot as SourceOfTruth,
      (spans || []) as SourceSpan[],
      config as TransformConfig,
      selectedTypes as OutputType[]
    );

    return NextResponse.json({ outputs });
  } catch (error: any) {
    console.error('Generate route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate coordinated outputs', details: error.message },
      { status: 500 }
    );
  }
}
