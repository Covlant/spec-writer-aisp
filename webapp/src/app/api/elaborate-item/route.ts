import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildElaborateItemPrompt } from '@/lib/prompts';
import { parseJsonFromResponse } from '@/lib/analyze';
import type { DetailLevel, SpecItem } from '@/lib/types';

function findSourceLevel(
  item: SpecItem,
  targetLevel: DetailLevel,
): DetailLevel | 0 {
  for (let lvl = targetLevel - 1; lvl >= 1; lvl--) {
    const content = item.levels[lvl as DetailLevel];
    if (content?.trim()) return lvl as DetailLevel;
  }
  return 0;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const { item, targetLevel, fullSpecContext } = (await request.json()) as {
      item: SpecItem;
      targetLevel: DetailLevel;
      fullSpecContext?: string;
    };

    if (!item || !targetLevel || targetLevel < 1 || targetLevel > 5) {
      return NextResponse.json(
        { error: 'item and targetLevel (1-5) are required' },
        { status: 400 },
      );
    }

    const sourceLevel = findSourceLevel(item, targetLevel);

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildElaborateItemPrompt(
            item,
            sourceLevel,
            targetLevel,
            fullSpecContext ?? '',
          ),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = parseJsonFromResponse(responseText) as
      | { draft?: string }
      | undefined;

    const draft = parsed?.draft?.trim() ?? '';
    if (!draft) {
      return NextResponse.json(
        { error: 'Model returned no draft content' },
        { status: 502 },
      );
    }

    return NextResponse.json({ draft, sourceLevel });
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
    const messageText =
      err instanceof Error ? err.message : 'Elaboration failed';
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
