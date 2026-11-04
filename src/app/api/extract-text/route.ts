import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'The uploaded file is empty' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds the 5 MB limit' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isTxt = fileName.endsWith('.txt') || file.type === 'text/plain';

    if (!isPdf && !isTxt) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and TXT files are accepted.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let extracted = '';

    if (isPdf) {
      const { text } = await extractText(new Uint8Array(arrayBuffer));
      if (Array.isArray(text)) {
        extracted = text.join('\n\n');
      } else {
        extracted = text || '';
      }
    } else {
      const decoder = new TextDecoder('utf-8');
      extracted = decoder.decode(arrayBuffer);
    }

    // Limit text to avoid blowing token context (e.g. max ~15,000 characters)
    extracted = extracted.slice(0, 15000).trim();

    return NextResponse.json({ text: extracted, fileName: file.name });
  } catch (error: unknown) {
    console.error('Error extracting text:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract text';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
