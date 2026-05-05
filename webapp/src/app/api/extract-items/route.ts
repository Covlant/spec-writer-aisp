import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildExtractItemsPrompt } from '@/lib/prompts';
import { parseJsonFromResponse } from '@/lib/analyze';
import type { DetailLevel, SpecItem, SpecItemKind } from '@/lib/types';

const VALID_KINDS: SpecItemKind[] = [
  'requirement',
  'behavior',
  'constraint',
  'note',
];

type RawItem = {
  id?: unknown;
  title?: unknown;
  kind?: unknown;
  levels?: unknown;
};

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

function normalizeItems(raw: unknown): SpecItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: SpecItem[] = [];

  for (const r of items as RawItem[]) {
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    if (!title) continue;
    let id =
      typeof r.id === 'string' && r.id.trim() ? slugify(r.id) : slugify(title);
    let suffix = 2;
    while (seen.has(id)) id = `${slugify(title)}-${suffix++}`;
    seen.add(id);

    const kind: SpecItemKind | undefined =
      typeof r.kind === 'string' &&
      VALID_KINDS.includes(r.kind as SpecItemKind)
        ? (r.kind as SpecItemKind)
        : undefined;

    const levels: Partial<Record<DetailLevel, string>> = {};
    if (r.levels && typeof r.levels === 'object') {
      for (const [k, v] of Object.entries(r.levels as Record<string, unknown>)) {
        const lvl = Number(k);
        if (lvl >= 1 && lvl <= 5 && typeof v === 'string' && v.trim()) {
          levels[lvl as DetailLevel] = v;
        }
      }
    }

    result.push({ id, title, kind, levels });
  }
  return result;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const { prose } = (await request.json()) as { prose?: string };
    if (!prose?.trim()) {
      return NextResponse.json(
        { error: 'prose is required' },
        { status: 400 },
      );
    }

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: buildExtractItemsPrompt(prose) },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = parseJsonFromResponse(responseText);
    const items = normalizeItems(parsed);

    return NextResponse.json({ items });
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
      err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
