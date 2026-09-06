import { NextRequest, NextResponse } from 'next/server';
import { OutputType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { outputId, outputType, action, scheduledTime } = await req.json();

    if (!outputId || !outputType || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // WhatsApp Channels have NO official publishing API in Meta Cloud API
    if (outputType === 'whatsapp' && action === 'publish_now') {
      return NextResponse.json({
        success: false,
        requiresDisclosure: true,
        message: 'WhatsApp Channel publishing cannot be executed live: Meta Cloud API does not support posting to Channels as of current documentation. Content generation is verified; publish is simulated per architectural design.',
        status: 'draft',
      }, { status: 422 });
    }

    const timestamp = new Date().toISOString();
    const isSchedule = action === 'schedule';

    return NextResponse.json({
      success: true,
      outputId,
      outputType,
      status: isSchedule ? 'scheduled' : 'published',
      scheduledAt: isSchedule ? scheduledTime || new Date(Date.now() + 86400000).toISOString() : undefined,
      publishedAt: !isSchedule ? timestamp : undefined,
      platformDispatchId: `disp_${outputType}_${Math.random().toString(36).substring(2, 9)}`,
      simulatedNotice: `Simulated state transition: ${action.toUpperCase()} dispatched to ${outputType.toUpperCase()} sandbox queue.`
    });
  } catch (error: any) {
    console.error('Publish route error:', error);
    return NextResponse.json({ error: 'Failed to process publish action' }, { status: 500 });
  }
}
