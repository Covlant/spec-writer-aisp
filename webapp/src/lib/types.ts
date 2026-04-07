export type Phase =
  | 'write'
  | 'analyzing'
  | 'clarify'
  | 'generating'
  | 'output';

export type GapCategory =
  | 'ambiguous_term'
  | 'missing_definition'
  | 'incomplete_rule'
  | 'undefined_type'
  | 'missing_error_case'
  | 'missing_edge_case'
  | 'conflicting_rule'
  | 'unquantified_statement';

export type GapSeverity = 'critical' | 'major' | 'minor';

export type ConversionResult = {
  output: string;
  tier: string;
  confidence: number;
  unmapped: string[];
  tokens: {
    input: number;
    output: number;
    ratio: number;
  };
};

export type ValidationResult = {
  valid: boolean;
  tier: string;
  tierName: string;
  delta: number;
  pureDensity: number;
};

export type Gap = {
  id: string;
  category: GapCategory;
  severity: GapSeverity;
  location: string;
  question: string;
  context: string;
  suggestion?: string;
  answer?: string;
};

export type AnalysisResult = {
  aisp: string;
  validation: ValidationResult;
  gaps: Gap[];
  summary: string;
};

export type GenerationResult = {
  finalSpec: string;
  vitestTests: string;
  playwrightTests: string;
};

export type SpecFlowState = {
  phase: Phase;
  prose: string;
  livePreview: ConversionResult | null;
  analysis: AnalysisResult | null;
  gaps: Gap[];
  generation: GenerationResult | null;
  error: string | null;
};
