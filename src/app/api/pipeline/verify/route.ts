import { NextRequest, NextResponse } from 'next/server';
import { GeminiPipelineService } from '@/lib/gemini';
import { OutputItem, SourceOfTruth, SourceSpan } from '@/types';
import { getGeminiApiKey, sanitizeSecretOutput } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { sot, spans, outputs } = await req.json();

    if (!outputs || outputs.length === 0) {
      return NextResponse.json({ error: 'Outputs are required for verification' }, { status: 400 });
    }

    const geminiApiKey = getGeminiApiKey();
    const service = new GeminiPipelineService(geminiApiKey);
    const { verification, verifiedOutputs } = await service.verifyGroundednessAndConsistency(
      sot as SourceOfTruth,
      (spans || []) as SourceSpan[],
      outputs as OutputItem[]
    );

    return NextResponse.json({ verification, verifiedOutputs });
  } catch (error: any) {
    const cleanMessage = sanitizeSecretOutput(error.message || 'Failed to verify outputs');
    console.error('Verify route error:', cleanMessage);
    return NextResponse.json(
      { error: cleanMessage },
      { status: 500 }
    );
  }
}
