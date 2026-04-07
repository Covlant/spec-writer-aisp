# AISP - AI Symbolic Protocol

**The Assembly Language for AI Cognition** — Created by [Bradley Ross](https://linkedin.com/in/bradaross)

AISP is the open standard for precise AI-to-AI and human-to-AI communication. It reduces prompt ambiguity from 40-65% to under 2%, enabling deterministic, proof-carrying specifications that AI systems understand natively.

This repository contains the **AISP open-core specification** (documentation, 512-symbol reference, evidence examples) and the **AISP Spec Writer** — a web application that converts natural-language product specs into AISP, identifies gaps, and generates test artifacts.

[![npm: aisp-converter](https://img.shields.io/npm/v/aisp-converter.svg?label=aisp-converter&color=blue)](https://www.npmjs.com/package/aisp-converter)
[![npm: aisp-validator](https://img.shields.io/npm/v/aisp-validator.svg?label=aisp-validator&color=blue)](https://www.npmjs.com/package/aisp-validator)
[![crates.io: aisp](https://img.shields.io/crates/v/aisp.svg?label=aisp-rust&color=orange)](https://crates.io/crates/aisp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AISP 5.1](https://img.shields.io/badge/AISP-5.1%20Platinum-purple.svg)](AI_GUIDE.md)

---

## AISP Spec Writer — Web Application

A Next.js web app that guides you through writing unambiguous product specifications using AISP. It follows a **4-phase pipeline**:

```
 ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
 │ 1.WRITE │ ──→ │ 2.ANALYZE│ ──→ │ 3.CLARIFY │ ──→ │4.GENERATE│
 │  prose   │     │ AISP +   │     │ fill gaps │     │ specs +  │
 │  editor  │     │  gaps    │     │  (form)   │     │  tests   │
 └─────────┘     └──────────┘     └───────────┘     └──────────┘
```

1. **Write** — Write your product spec in natural language; see a live AISP preview as you type
2. **Analyze** — The app converts to AISP, validates quality, and uses Claude to identify gaps (ambiguous terms, missing definitions, edge cases, etc.)
3. **Clarify** — All gaps appear as a form sorted by severity; answer each question to resolve ambiguities
4. **Generate** — Produces three output artifacts:
   - **Final Spec** — Complete, unambiguous product specification with all gaps resolved
   - **Unit Tests** — Vitest tests for every logical function extracted from the spec
   - **E2E Tests** — Playwright tests for every user flow (happy path + negative path)

### Quick Start

```bash
cd webapp
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

### Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      Next.js App (webapp/)                        │
├──────────────────────────┬────────────────────────────────────────┤
│    Client (React/TS)     │          Server (API Routes)           │
│                          │                                        │
│  Phase 1: SpecEditor     │  POST /api/convert                    │
│    ↓ prose text          │    aisp-converter → live AISP preview  │
│  Phase 2: "Analyze" ────────→ POST /api/analyze                  │
│    ↓                     │    convert + validate + Claude gaps    │
│  AISPPanel + GapList     │    ← { aisp, gaps[], summary }        │
│    ↓                     │                                        │
│  Phase 3: ClarifyForm    │  (client-side: user fills in answers) │
│    ↓ gap answers         │                                        │
│  Phase 4: "Generate" ───────→ POST /api/generate                 │
│    ↓                     │    Claude: prose + answers → outputs   │
│  OutputTabs              │    ← { spec, unitTests, e2eTests }    │
│    • Final Spec          │                                        │
│    • Unit Tests (Vitest) │                                        │
│    • E2E Tests (PW)      │                                        │
└──────────────────────────┴────────────────────────────────────────┘
```

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Full-stack: React frontend + API routes |
| Language | TypeScript | Type safety across client/server |
| Styling | Tailwind CSS 4 | CSS-first config, fast to build |
| AISP conversion | `aisp-converter` | Official prose-to-AISP converter |
| AISP validation | `aisp-validator` | Official AISP syntax/quality validator (WASM kernel) |
| LLM | `@anthropic-ai/sdk` | Claude API for gap analysis + output generation |
| Persistence | Browser localStorage | No database needed for MVP |

### File Structure

```
webapp/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.example                        # ANTHROPIC_API_KEY
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with metadata
│   │   ├── page.tsx                    # Main page — orchestrates 4 phases
│   │   ├── globals.css                 # Tailwind imports + custom theme
│   │   └── api/
│   │       ├── convert/route.ts        # Prose → AISP live preview
│   │       ├── analyze/route.ts        # Convert + validate + gap analysis
│   │       └── generate/route.ts       # Generate spec + unit tests + E2E tests
│   ├── components/
│   │   ├── AppShell.tsx                # Header + phase stepper + content area
│   │   ├── SpecEditor.tsx              # Phase 1: split-view textarea + AISP preview
│   │   ├── AnalysisView.tsx            # Phase 2: loading spinner with substep progress
│   │   ├── ClarifyForm.tsx             # Phase 3: gap cards with input fields
│   │   ├── OutputView.tsx              # Phase 4: tabbed output (spec, unit, e2e)
│   │   ├── CodeBlock.tsx               # Syntax-highlighted code with copy button
│   │   └── QualityBadge.tsx            # Tier badge (Platinum, Gold, Silver, etc.)
│   ├── lib/
│   │   ├── types.ts                    # Shared TypeScript types
│   │   ├── aisp.ts                     # Server wrappers for converter/validator
│   │   ├── prompts.ts                  # Claude system/user prompts (embeds CHEATSHEET.md)
│   │   ├── analyze.ts                  # Claude gap analysis module
│   │   ├── generate.ts                 # Claude output generation module
│   │   └── examples.ts                 # Built-in example specs
│   └── hooks/
│       └── useSpecFlow.ts              # useReducer state machine for 4-phase flow
```

### API Routes

| Endpoint | Input | Output | LLM? |
|----------|-------|--------|------|
| `POST /api/convert` | `{ prose }` | `{ output, tier, confidence, unmapped, tokens }` | No |
| `POST /api/analyze` | `{ prose }` | `{ aisp, validation, gaps[], summary }` | Yes |
| `POST /api/generate` | `{ prose, aisp, gaps[] }` | `{ finalSpec, vitestTests, playwrightTests }` | Yes |

The `/api/convert` route is called on every keystroke (debounced 500ms) for the live preview. It uses only the deterministic Rosetta Stone mappings from `aisp-converter` and requires no API key.

The `/api/analyze` and `/api/generate` routes call Claude (Sonnet) and require `ANTHROPIC_API_KEY` in `.env.local`.

### Gap Analysis

Claude analyzes specs across 8 categories of incompleteness:

| Category | What it catches |
|----------|----------------|
| `ambiguous_term` | Terms that could mean multiple things |
| `missing_definition` | Types or concepts used but never defined |
| `incomplete_rule` | Business rules missing conditions or outcomes |
| `undefined_type` | Data types referenced without structure |
| `missing_error_case` | No handling for failure scenarios |
| `missing_edge_case` | Boundary conditions and limits not addressed |
| `conflicting_rule` | Rules that contradict each other |
| `unquantified_statement` | Vague statements like "fast" without numbers |

Each gap is assigned a severity (`critical`, `major`, `minor`), a question to ask the user, and an optional suggested answer.

---

## Try It Now — CLI (No Installation Required)

```bash
# Convert natural language to AISP
npx aisp-converter "Define x as 5"
# Output: x≜5

# Validate AISP syntax and get quality tier
npx aisp-validator validate spec.aisp
# Output: ✓ VALID (Gold tier, δ=0.64)
```

**Zero install. Zero build. Just run with `npx` or `cargo`.**

---

## What is AISP?

AISP (AI Symbolic Protocol) replaces ambiguous natural language with precise mathematical notation — the same symbols used in formal logic, type theory, and category theory.

| Natural Language | AISP Notation | Ambiguity |
|------------------|---------------|-----------|
| "Define x as 5" | `x≜5` | 0% |
| "For all users, if admin then allow" | `∀u∈Users:admin(u)⇒allow(u)` | 0% |
| "There exists a valid solution" | `∃x:valid(x)` | 0% |
| "A implies B" | `A⇒B` | 0% |

**Result:** AI models produce consistent, unambiguous, machine-verifiable outputs.

---

## Why AISP?

| Problem | Traditional Prompts | With AISP |
|---------|---------------------|-----------|
| **Ambiguity Rate** | 40-65% | <2% |
| **Misinterpretation** | 25-40% | <1% |
| **10-Step Pipeline Success** | 59% | 95% |
| **Clarification Requests** | 3-5 per task | 0-1 per task |

**97x improvement** in multi-step pipeline success rate. [See evidence →](evidence/)

---

## Official Specification

> **[AI_GUIDE.md](AI_GUIDE.md)** is the authoritative AISP 5.1 Platinum Specification.

This is the source of truth for:
- **512 Official Symbols (Σ_512)** — 8 categories × 64 symbols each
- **Quality Tiers** — Platinum (◊⁺⁺) to Bronze (◊⁻) grading
- **Grammar & Syntax** — Deterministic parsing rules
- **Proof System** — Natural deduction + category theory

Copy [AI_GUIDE.md](AI_GUIDE.md) into any AI system's context (Claude, GPT-4, Gemini, etc.) and it will understand AISP natively.

---

## Official Tools

These are the **official** AISP conversion and validation tools:

### npm (Node.js)

```bash
# Convert prose to AISP
npx aisp-converter "Define x as 5"

# Validate AISP documents
npx aisp-validator validate spec.aisp

# Check quality tier
npx aisp-validator tier spec.aisp
```

### Rust (crates.io) — Fastest

```bash
# Install
cargo install aisp aisp-converter

# Convert
aisp-converter "Define x as 5"

# Validate
aisp validate spec.aisp
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **512 Official Symbols** | Complete Σ_512 glossary across 8 categories: Transmuters, Topologics, Quantifiers, Contractors, Domains, Intents, Delimiters, Reserved |
| **3-Tier Conversion** | Minimal (simple defs), Standard (rules + types), Full (specifications + proofs) |
| **Quality Grading** | Platinum (◊⁺⁺), Gold (◊⁺), Silver (◊), Bronze (◊⁻), Reject (⊘) based on semantic density |
| **LLM Fallback** | Automatic AI enhancement when rule-based conversion has low confidence |
| **Proof-Carrying** | Every document includes `⟦Ε⟧` evidence block with validation proof |
| **Cross-Platform** | npm, Rust crate, WASM for browser |

---

## Quick Reference (Rosetta Stone)

| Prose | Symbol | Category |
|-------|--------|----------|
| for all, every, each | `∀` | Quantifier |
| there exists, some | `∃` | Quantifier |
| exists unique, exactly one | `∃!` | Quantifier |
| defined as, is a | `≜` | Definition |
| assigned, becomes | `≔` | Assignment |
| implies, then, if-then | `⇒` | Logic |
| if and only if, iff | `⇔` | Logic |
| and, both | `∧` | Logic |
| or, either | `∨` | Logic |
| not, negation | `¬` | Logic |
| in, element of | `∈` | Set |
| subset of | `⊆` | Set |
| union | `∪` | Set |
| intersection | `∩` | Set |
| true, valid | `⊤` | Truth |
| false, invalid | `⊥` | Truth |
| lambda, function | `λ` | Function |
| maps to | `↦` | Function |

**[Full Cheatsheet (all 512 symbols) →](CHEATSHEET.md)** | **[Complete Reference →](reference.md)**

---

## Quality Tiers

AISP documents are graded by semantic density (δ):

| Symbol | Tier | Density | Use Case |
|--------|------|---------|----------|
| ◊⁺⁺ | Platinum | δ ≥ 0.75 | Production specs, AI-to-AI contracts |
| ◊⁺ | Gold | δ ≥ 0.60 | High-quality documentation |
| ◊ | Silver | δ ≥ 0.40 | Working drafts, prototypes |
| ◊⁻ | Bronze | δ ≥ 0.20 | Initial conversions, learning |
| ⊘ | Reject | δ < 0.20 | Invalid, needs revision |

```bash
# Check tier of your document
npx aisp-validator tier myspec.aisp
# Output: ◊⁺ Gold

# Enforce minimum tier in CI/CD
npx aisp-validator validate myspec.aisp --min-tier gold
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[AI_GUIDE.md](AI_GUIDE.md)** | **Official Specification** — AISP 5.1 for AI systems |
| **[HUMAN_GUIDE.md](HUMAN_GUIDE.md)** | Tutorial for humans learning AISP |
| **[CHEATSHEET.md](CHEATSHEET.md)** | Rosetta Stone quick reference |
| **[reference.md](reference.md)** | Complete 512-symbol glossary |
| **[examples/](examples/)** | Copy-paste CLI examples by tier |
| **[guides/advanced/](guides/advanced/)** | Deep dive into AISP internals |
| **[webapp/](webapp/)** | AISP Spec Writer web application |

---

## Advanced Capabilities

For those who want to understand the internals of AISP 5.1:

| Pillar | Topics | Link |
|--------|--------|------|
| **Physics** | Signal Theory, Pockets, Binding | [01_PHYSICS.md](guides/advanced/01_PHYSICS.md) |
| **Cognition** | Hebbian Learning, Ghost Search, Recursion | [02_COGNITION.md](guides/advanced/02_COGNITION.md) |
| **Mathematics** | Category Theory, Error Algebra, Inference | [03_MATH.md](guides/advanced/03_MATH.md) |
| **Agent Guide** | Templates, Evidence, Enforcement | [04_AGENT.md](guides/advanced/04_AGENT.md) |

---

## Use Cases

AISP is designed for:

- **AI Agent Instructions** — Unambiguous task specifications
- **Multi-Agent Coordination** — Zero-drift communication protocols
- **API Contracts** — Formal pre/post conditions
- **State Machines** — Precise state transition rules
- **Requirements Engineering** — Machine-verifiable specifications
- **Safety Constraints** — Provable safety properties

---

## Evidence & Validation

Real-world tests demonstrating AISP effectiveness:

| Test | Result | Link |
|------|--------|------|
| Tic-Tac-Toe Rules | 6 ambiguities → 0 | [evidence/tic-tac-toe/](evidence/tic-tac-toe/) |
| E2E Conversion | Full workflow demo | [evidence/e2e-conversion-guide/](evidence/e2e-conversion-guide/) |
| Rosetta Stone | 512 symbols validated | [evidence/rosetta-stone/](evidence/rosetta-stone/) |
| Pipeline Test | 97x improvement | [evidence/](evidence/) |

---

## Installation Options

```bash
# Option 1: No install (recommended)
npx aisp-converter "your text"
npx aisp-validator validate file.aisp

# Option 2: Global npm install
npm install -g aisp-converter aisp-validator

# Option 3: Rust crate (fastest performance)
cargo install aisp aisp-converter
```

---

## Repository Structure

```
spec-writer-aisp/
├── AI_GUIDE.md              # Official AISP 5.1 Platinum Specification
├── HUMAN_GUIDE.md           # Tutorial for humans learning AISP
├── CHEATSHEET.md            # Quick reference for symbol conversions
├── reference.md             # Complete 512-symbol glossary
├── examples/                # CLI examples by tier (minimal, standard, full)
├── guides/advanced/         # Deep dive: physics, cognition, math, agents
├── evidence/                # Real-world validation tests
│   ├── tic-tac-toe/         # Comparative analysis (72/100 → 91/100)
│   ├── rosetta-stone/       # 512 symbols validated at each tier
│   ├── creative-short-story/# Creative domain: 98% alignment across LLMs
│   └── e2e-conversion-guide/# Step-by-step conversion examples
└── webapp/                  # AISP Spec Writer (Next.js 15 web app)
    └── src/
        ├── app/api/         # API routes (convert, analyze, generate)
        ├── components/      # React UI components
        ├── hooks/           # State management (useSpecFlow)
        └── lib/             # AISP wrappers, Claude prompts, types
```

---

## Topics

`aisp` `ai-symbolic-protocol` `symbolic-notation` `formal-methods` `formal-specification` `type-theory` `category-theory` `prose-to-code` `natural-language-processing` `llm` `prompt-engineering` `ai-tools` `ai-agents` `multi-agent` `wasm` `typescript` `rust`

---

## Links

| Resource | URL |
|----------|-----|
| **npm: aisp-converter** | https://www.npmjs.com/package/aisp-converter |
| **npm: aisp-validator** | https://www.npmjs.com/package/aisp-validator |
| **crates.io: aisp** | https://crates.io/crates/aisp |
| **GitHub** | https://github.com/bar181/aisp-open-core |
| **Author** | [Bradley Ross](https://linkedin.com/in/bradaross) |

---

## About the Inventor

**AISP** was created by **Bradley Ross** ([@bar181](https://github.com/bar181)) as an open standard for reducing ambiguity in AI communication. The protocol draws from formal logic, type theory, and category theory to create a deterministic, proof-carrying notation that AI systems can parse and verify.

---

## License

**MIT License** — Copyright (c) 2026 Bradley Ross

See [LICENSE](LICENSE) for full terms.

---

## Citation

```bibtex
@misc{ross2026aisp,
  author = {Ross, Bradley},
  title = {AISP: AI Symbolic Protocol - The Assembly Language for AI Cognition},
  year = {2026},
  publisher = {GitHub},
  url = {https://github.com/bar181/aisp-open-core}
}
```

---

**Made with precision by [Bradley Ross](https://linkedin.com/in/bradaross)** | **[Report Issues](https://github.com/bar181/aisp-open-core/issues)**
