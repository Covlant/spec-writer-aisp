import Anthropic from '@anthropic-ai/sdk';
import { convertProse, validateAisp } from './aisp';
import { AISP_SYSTEM_PROMPT, buildAnalyzePrompt } from './prompts';
import type { AnalysisResult, Gap } from './types';

export function parseJsonFromResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // noop
  }

  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // noop
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch {
      // noop
    }
  }

  throw new Error('Failed to parse JSON from AI response');
}

export async function analyzeSpec(prose: string): Promise<AnalysisResult> {
  const conversion = convertProse(prose);
  const validation = await validateAisp(conversion.output);

  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AISP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildAnalyzePrompt(prose, conversion.output, validation),
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = parseJsonFromResponse(responseText) as {
    gaps: Omit<Gap, 'id'>[];
    summary: string;
  };

  const gaps: Gap[] = (parsed.gaps ?? []).map((g, i) => ({
    ...g,
    id: `gap-${i + 1}`,
    status: 'pending' as const,
  }));

  return {
    aisp: conversion.output,
    validation,
    gaps,
    summary: parsed.summary ?? 'Analysis complete.',
  };
}
