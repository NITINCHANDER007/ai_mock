import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    let extracted = '';

    if (fileName.endsWith('.pdf')) {
      const { text } = await extractText(new Uint8Array(arrayBuffer));
      if (Array.isArray(text)) {
        extracted = text.join('\n\n');
      } else {
        extracted = text || '';
      }
    } else if (fileName.endsWith('.txt')) {
      const decoder = new TextDecoder('utf-8');
      extracted = decoder.decode(arrayBuffer);
    } else {
      // Fallback try text decoder
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

