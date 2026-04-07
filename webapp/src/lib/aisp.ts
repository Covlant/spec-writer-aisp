import { autoConvert } from 'aisp-converter';
import AISP from 'aisp-validator';
import type { ConversionResult, ValidationResult } from './types';

let validatorInitialized = false;

async function ensureValidatorInit() {
  if (!validatorInitialized) {
    await AISP.init();
    validatorInitialized = true;
  }
}

export function convertProse(prose: string): ConversionResult {
  const result = autoConvert(prose);
  return {
    output: result.output,
    tier: result.tier,
    confidence: result.confidence,
    unmapped: result.unmapped,
    tokens: result.tokens,
  };
}

export async function validateAisp(aisp: string): Promise<ValidationResult> {
  await ensureValidatorInit();
  const result = AISP.validate(aisp);
  return {
    valid: result.valid,
    tier: result.tier ?? '⊘',
    tierName: result.tierName ?? 'Reject',
    delta: result.delta ?? 0,
    pureDensity: result.pureDensity ?? 0,
  };
}
