import { NextResponse } from 'next/server';
import { convertProse } from '@/lib/aisp';

export async function POST(request: Request) {
  try {
    const { prose } = (await request.json()) as { prose: string };

    if (!prose || typeof prose !== 'string' || prose.trim().length === 0) {
      return NextResponse.json(
        { error: 'prose is required' },
        { status: 400 },
      );
    }

    const result = convertProse(prose);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
