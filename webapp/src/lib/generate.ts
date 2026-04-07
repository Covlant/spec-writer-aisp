import Anthropic from '@anthropic-ai/sdk';
import { AISP_SYSTEM_PROMPT, buildGeneratePrompt } from './prompts';
import { parseJsonFromResponse } from './analyze';
import type { Gap, GenerationResult } from './types';

export async function generateOutputs(
  prose: string,
  aisp: string,
  gaps: Gap[],
): Promise<GenerationResult> {
  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: AISP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildGeneratePrompt(prose, aisp, gaps),
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = parseJsonFromResponse(responseText) as GenerationResult;

  return {
    finalSpec: parsed.finalSpec ?? '',
    vitestTests: parsed.vitestTests ?? '',
    playwrightTests: parsed.playwrightTests ?? '',
  };
}
