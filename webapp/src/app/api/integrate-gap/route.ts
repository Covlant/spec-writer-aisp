import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildGapIntegratePrompt } from '@/lib/prompts';
import { parseJsonFromResponse } from '@/lib/analyze';
import { convertProse, validateAisp } from '@/lib/aisp';
import type { Gap } from '@/lib/types';

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const { prose, gap } = (await request.json()) as {
      prose: string;
      gap: Gap;
    };

    if (!prose || !gap?.answer?.trim()) {
      return NextResponse.json(
        { error: 'prose and gap with answer are required' },
        { status: 400 },
      );
    }

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildGapIntegratePrompt(gap, prose),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let updatedProse = responseText;
    const parsed = parseJsonFromResponse(responseText) as
      | { updated_specification?: string }
      | undefined;
    if (parsed && typeof parsed.updated_specification === 'string') {
      updatedProse = parsed.updated_specification;
    }

    const conversion = convertProse(updatedProse);
    const validation = await validateAisp(conversion.output);

    return NextResponse.json({
      updatedProse,
      aisp: conversion.output,
      validation,
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
    const message = err instanceof Error ? err.message : 'Integration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
