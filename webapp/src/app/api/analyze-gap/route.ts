import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AISP_SYSTEM_PROMPT, buildGapAnalyzePrompt } from '@/lib/prompts';
import type { GapAnalysisResult } from '@/lib/prompts';
import { parseJsonFromResponse } from '@/lib/analyze';
import type { Gap } from '@/lib/types';

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const { gap, prose } = (await request.json()) as {
      gap: Gap;
      prose: string;
    };

    if (!gap?.answer?.trim()) {
      return NextResponse.json(
        { error: 'Gap answer is required' },
        { status: 400 },
      );
    }

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: AISP_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildGapAnalyzePrompt(gap, prose),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = parseJsonFromResponse(responseText) as GapAnalysisResult;

    const status =
      parsed.status === 'ready' ? 'ready' : 'needs_refinement';

    return NextResponse.json({
      status,
      feedback: parsed.feedback ?? '',
    });
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please wait a moment and try again.' },
          { status: 429 },
        );
      }
    }
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
