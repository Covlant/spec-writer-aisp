declare module 'aisp-validator' {
  type ValidateResult = {
    valid: boolean;
    tier?: string;
    tierValue?: number;
    tierName?: string;
    delta?: number;
    pureDensity?: number;
    ambiguity?: number;
    errorCode?: number;
    error?: string;
    mode?: string;
    docSize?: number;
  };

  type DebugResult = {
    tier: string;
    tierValue: number;
    tierName: string;
    delta: number;
    pureDensity: number;
    blockScore: number;
    bindingScore: number;
    breakdown: Record<string, number>;
  };

  const AISP: {
    init(options?: string | { wasmPath?: string; maxDocSize?: number }): Promise<number>;
    validate(source: string, options?: { strict?: boolean }): ValidateResult;
    isValid(source: string): boolean;
    getDensity(source: string): number;
    getTier(source: string): string;
    debug(source: string): DebugResult;
    validateFile(filePath: string): Promise<ValidateResult>;
    debugFile(filePath: string): Promise<DebugResult>;
    setMaxDocSize(size: number): void;
  };

  export default AISP;
  export const init: typeof AISP.init;
  export const validate: typeof AISP.validate;
  export const isValid: typeof AISP.isValid;
  export const getDensity: typeof AISP.getDensity;
  export const getTier: typeof AISP.getTier;
  export const validateFile: typeof AISP.validateFile;
  export const debug: typeof AISP.debug;
  export const debugFile: typeof AISP.debugFile;
  export const setMaxDocSize: typeof AISP.setMaxDocSize;
  export function calculateSemanticDensity(text: string): {
    delta: number;
    blockScore: number;
    bindingScore: number;
    pureDensity: number;
    breakdown: Record<string, number>;
  };
  export function calculatePureDensity(text: string): {
    pureDensity: number;
    symbolCount: number;
    tokenCount: number;
  };
  export function getTierFromDelta(delta: number): {
    tier: string;
    tierValue: number;
    tierName: string;
  };
  export const AISP_SYMBOLS: string[];
  export const SUPPORTED_EXTENSIONS: string[];
  export const SIZE_LIMITS: {
    DEFAULT_MAX: number;
    ABSOLUTE_MAX: number;
    WASM_MAX: number;
  };
}
