import { NextRequest, NextResponse } from 'next/server';
import { getTopicTrendSignals } from '@/lib/trends';
import { sanitizeSecretOutput } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('topic') || '';

    if (!query.trim()) {
      return NextResponse.json({ error: 'Search topic query parameter (q) is required' }, { status: 400 });
    }

    const result = await getTopicTrendSignals(query);
    return NextResponse.json(result);
  } catch (error: any) {
    const cleanMessage = sanitizeSecretOutput(error.message || 'Failed to fetch trend intelligence');
    console.error('Trends route error:', cleanMessage);
    return NextResponse.json(
      { error: cleanMessage },
      { status: 500 }
    );
  }
}
