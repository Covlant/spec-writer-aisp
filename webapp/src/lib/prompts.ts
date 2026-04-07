import type { ValidationResult, Gap, GapStatus } from './types';

const CHEATSHEET = `## AISP Symbol Reference

### Quantifiers
| Prose | Symbol | Example |
|-------|--------|---------|
| for all, every, each | ∀ | ∀x∈S |
| there exists, some | ∃ | ∃x:P(x) |
| exists unique | ∃! | ∃!x:unique(x) |
| does not exist | ∄ | ∄x:false(x) |

### Logic
| Prose | Symbol | Example |
|-------|--------|---------|
| and, both | ∧ | A∧B |
| or, either | ∨ | A∨B |
| not | ¬ | ¬A |
| implies, if-then | ⇒ | A⇒B |
| iff | ⇔ | A⇔B |
| xor | ⊕ | A⊕B |

### Comparison
| Prose | Symbol |
|-------|--------|
| greater than | > |
| less than | < |
| at least | ≥ |
| at most | ≤ |
| equals | ≡ |
| not equal | ≢ |
| approximately | ≈ |

### Definition
| Prose | Symbol | Example |
|-------|--------|---------|
| defined as | ≜ | x≜5 |
| assigned | ≔ | x≔x+1 |
| maps to | ↦ | x↦x² |

### Sets
| Prose | Symbol |
|-------|--------|
| element of | ∈ |
| not in | ∉ |
| subset of | ⊆ |
| union | ∪ |
| intersection | ∩ |
| empty set | ∅ |

### Types
| Prose | Symbol |
|-------|--------|
| natural numbers | ℕ |
| integers | ℤ |
| real numbers | ℝ |
| boolean | 𝔹 |
| string | 𝕊 |

### Functions
| Prose | Symbol |
|-------|--------|
| lambda | λ |
| compose | ∘ |

### Truth Values
| Prose | Symbol |
|-------|--------|
| true | ⊤ |
| false | ⊥ |

### Block Markers
| Block | Symbol | Purpose |
|-------|--------|---------|
| Meta | ⟦Ω⟧ | Document metadata |
| Types | ⟦Σ⟧ | Type definitions |
| Rules | ⟦Γ⟧ | Business rules |
| Functions | ⟦Λ⟧ | Function definitions |
| Errors | ⟦Χ⟧ | Error handling |
| Evidence | ⟦Ε⟧ | Validation proof |

### Quality Tiers
| Symbol | Tier | Density (δ) |
|--------|------|-------------|
| ◊⁺⁺ | Platinum | δ ≥ 0.75 |
| ◊⁺ | Gold | δ ≥ 0.60 |
| ◊ | Silver | δ ≥ 0.40 |
| ◊⁻ | Bronze | δ ≥ 0.20 |
| ⊘ | Reject | δ < 0.20 |`;

const TIC_TAC_TOE_EXAMPLE = `## Example: Tic-Tac-Toe Spec (Platinum tier)
\`\`\`
𝔸1.0.tic-tac-toe@2026-01-15
γ≔game-spec

⟦Ω:Meta⟧{
  ∀D∈AISP:Ambig(D)<0.02
  Target≜AI-Agents
}

⟦Σ:Types⟧{
  Player≜{X,O}
  Cell≜{Empty,X,O}
  Board≜Cell[9]
  GameState≜{Playing,Won(Player),Draw}
}

⟦Γ:Rules⟧{
  ∀move:ValidMove(board,pos)⇔board[pos]=Empty
  ∀win:WinCondition⇔∃line∈Lines:∀c∈line:c=player
  Lines≜{rows,cols,diags}
}

⟦Λ:Funcs⟧{
  makeMove≜λ(board,pos,player).board[pos]←player
  checkWin≜λboard.∃p∈Player:WinCondition(board,p)
  nextPlayer≜λp.if p=X then O else X
}

⟦Ε⟧⟨δ≜0.75;φ≜100;τ≜◊⁺⁺⟩
\`\`\``;

export const AISP_SYSTEM_PROMPT = `You are an expert AISP (AI Symbolic Protocol) analyst and specification writer.

AISP is a formal specification language that reduces ambiguity from 40-65% to <2% using mathematical symbols. It uses 512 official symbols (Σ_512) across 8 categories.

${CHEATSHEET}

## AISP Document Structure
A complete AISP document has these blocks:
- ⟦Ω:Meta⟧ — Document metadata (ambiguity target, audience)
- ⟦Σ:Types⟧ — Type definitions (enums, records, arrays)
- ⟦Γ:Rules⟧ — Business rules and constraints
- ⟦Λ:Funcs⟧ — Function definitions (lambdas)
- ⟦Χ:Errors⟧ — Error handling (optional)
- ⟦Ε⟧ — Evidence block with density (δ), completeness (φ), tier (τ)

${TIC_TAC_TOE_EXAMPLE}

You MUST respond with valid JSON only. No markdown fences, no explanatory text outside the JSON.`;

export function buildAnalyzePrompt(
  prose: string,
  aisp: string,
  validation: ValidationResult,
): string {
  return `Analyze this product specification for gaps, ambiguities, and missing details.

## User's Prose Specification
${prose}

## AISP Conversion (auto-generated)
${aisp}

## Validation Result
- Valid: ${validation.valid}
- Tier: ${validation.tierName} (${validation.tier})
- Density: ${validation.delta.toFixed(2)}

## Your Task
Identify ALL gaps in this specification. For each gap, provide:
1. A category (one of: ambiguous_term, missing_definition, incomplete_rule, undefined_type, missing_error_case, missing_edge_case, conflicting_rule, unquantified_statement)
2. A severity (critical, major, minor)
3. The location in the spec this relates to
4. A clear, specific question to ask the user
5. Context explaining why this matters
6. An optional suggestion/default answer

Think carefully about:
- Terms that could mean multiple things
- Types that are used but never defined
- Rules that contradict each other
- Error/edge cases not mentioned (empty inputs, max limits, concurrent access)
- Statements lacking quantification ("should be fast" without numbers)
- Missing validation rules for inputs
- Undefined behavior at boundaries

Respond with this exact JSON structure:
{
  "gaps": [
    {
      "category": "ambiguous_term",
      "severity": "critical",
      "location": "Section or feature name",
      "question": "What specifically should happen when...?",
      "context": "The spec says X but doesn't define what X means quantitatively.",
      "suggestion": "A reasonable default answer"
    }
  ],
  "summary": "Brief 1-2 sentence analysis summary"
}`;
}

export type GapAnalysisResult = {
  status: GapStatus;
  feedback: string;
};

export function buildGapAnalyzePrompt(gap: Gap, prose: string): string {
  return `Evaluate whether the user's answer to a specification gap is sufficient to remove ambiguity.

## Original Specification (excerpt)
${prose}

## Gap Details
- Category: ${gap.category}
- Severity: ${gap.severity}
- Location: ${gap.location}
- Question: ${gap.question}
- Context: ${gap.context}

## User's Answer
${gap.answer}

## Your Task
Evaluate the answer against these criteria:
1. Does it fully resolve the ambiguity described in the gap?
2. Is the answer specific and quantifiable (not vague)?
3. Does it introduce any new ambiguities or contradictions?
4. Are edge cases addressed?

Respond with this exact JSON structure:
{
  "status": "ready" or "needs_refinement",
  "feedback": "If ready: a brief confirmation of what the answer resolves. If needs_refinement: specific guidance on what is still missing or unclear."
}

Use "ready" if the answer is clear, specific, and resolves the gap. Use "needs_refinement" if the answer is vague, incomplete, or introduces new questions.`;
}

export function buildGeneratePrompt(
  prose: string,
  aisp: string,
  gapsWithAnswers: Gap[],
): string {
  const answeredGaps = gapsWithAnswers
    .filter((g) => g.answer)
    .map(
      (g) =>
        `Q: ${g.question}\nA: ${g.answer}\n(Category: ${g.category}, Severity: ${g.severity})`,
    )
    .join('\n\n');

  return `Generate a complete, unambiguous product specification with tests based on the original spec and the clarified gaps.

## Original Prose Specification
${prose}

## AISP Conversion
${aisp}

## Clarified Gaps
${answeredGaps || 'No gaps were identified or all were skipped.'}

## Your Task
Produce THREE outputs:

### Output 1: Final Unambiguous Specification
Rewrite the original prose specification incorporating ALL gap answers. Requirements:
- Every term must be precisely defined
- Every rule must be complete with error cases
- Every edge case must be addressed
- Use precise language and numbered sections
- Organize into: Overview, Data Types, Business Rules, User Flows, Error Handling
- This should be the definitive spec a developer can implement from without asking a single question

### Output 2: Vitest Unit Tests
Write comprehensive Vitest unit tests that verify every logical function, rule, type constraint, and edge case. Requirements:
- Use \`import { describe, it, expect } from 'vitest'\`
- Group tests by feature area using \`describe\`
- For each function: positive case, negative case, edge cases, type validation
- Use realistic test data derived from the spec
- Include boundary condition tests

### Output 3: Playwright E2E Tests
Write Playwright end-to-end tests for every user-facing flow. Requirements:
- Use \`import { test, expect } from '@playwright/test'\`
- For each user flow: happy path + negative/error path
- Use realistic selectors (data-testid preferred)
- Include assertions for visible UI state changes
- Test error states and boundary conditions

Respond with this exact JSON structure:
{
  "finalSpec": "The complete specification text in markdown...",
  "vitestTests": "import { describe, it, expect } from 'vitest';\\n...",
  "playwrightTests": "import { test, expect } from '@playwright/test';\\n..."
}`;
}
