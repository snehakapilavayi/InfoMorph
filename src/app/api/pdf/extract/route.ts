import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { cleanRawDocumentText } from '@/lib/tokenizer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);
    const cleanedText = cleanRawDocumentText(data.text || '');

    return NextResponse.json({
      text: cleanedText || data.text,
      numPages: data.numpages,
      info: data.info,
    });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from PDF', details: error.message },
      { status: 500 }
    );
  }
}
