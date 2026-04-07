import { NextResponse } from 'next/server';
import { analyzeSpec } from '@/lib/analyze';

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const { prose } = (await request.json()) as { prose: string };

    if (!prose || typeof prose !== 'string' || prose.trim().length === 0) {
      return NextResponse.json(
        { error: 'prose is required' },
        { status: 400 },
      );
    }

    const result = await analyzeSpec(prose);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please wait a moment and try again.' },
          { status: 429 },
        );
      }
      if (status === 529) {
        return NextResponse.json(
          { error: 'AI service is temporarily overloaded. Please try again.' },
          { status: 503 },
        );
      }
    }
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
