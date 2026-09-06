import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { OutputItem, SourceOfTruth, SourceSpan } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { sot, spans, outputs, apiKey } = await req.json();

    if (!sot || !outputs || outputs.length === 0) {
      return NextResponse.json({ error: 'Source of Truth and outputs are required' }, { status: 400 });
    }

    const service = new GeminiPipelineService(apiKey);
    const verification = await service.verifyGroundednessAndConsistency(
      sot as SourceOfTruth,
      (spans || []) as SourceSpan[],
      outputs as OutputItem[]
    );

    return NextResponse.json({ verification });
  } catch (error: any) {
    console.error('Verify route error:', error);
    return NextResponse.json(
      { error: 'Failed to verify outputs', details: error.message },
      { status: 500 }
    );
  }
}
