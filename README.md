# AISP Spec Writer

Write natural-language product specifications, analyze them for ambiguity using [AISP](AI_GUIDE.md) (AI Symbolic Protocol), and generate test artifacts — all from a single web interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AISP 5.1](https://img.shields.io/badge/AISP-5.1%20Platinum-purple.svg)](AI_GUIDE.md)

---

## How It Works

The app follows a 4-phase pipeline:

```
 ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
 │ 1.WRITE │ ──→ │ 2.ANALYZE│ ──→ │ 3.CLARIFY │ ──→ │4.GENERATE│
 │  prose   │     │ AISP +   │     │ fill gaps │     │ specs +  │
 │  editor  │     │  gaps    │     │  (form)   │     │  tests   │
 └─────────┘     └──────────┘     └───────────┘     └──────────┘
```

1. **Write** — Write your product spec in natural language. A live AISP preview updates as you type, showing how your prose maps to formal symbols.
2. **Analyze** — The app converts your prose to AISP notation, validates its quality tier, and uses Claude to identify gaps: ambiguous terms, missing definitions, undefined edge cases, and more.
3. **Clarify** — Every gap appears as a form field sorted by severity. Answer each question to resolve ambiguities. Suggested answers are provided as hints.
4. **Generate** — Produces three output artifacts:
   - **Final Spec** — Complete, unambiguous product specification with all gaps resolved
   - **Unit Tests** — Vitest tests for every logical function extracted from the spec
   - **E2E Tests** — Playwright tests for every user flow (happy path + negative path)

---

## Quick Start

```bash
cd webapp
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

Requires Node.js 18+ and an [Anthropic API key](https://console.anthropic.com/).

---

## Architecture

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
| AISP conversion | [`aisp-converter`](https://www.npmjs.com/package/aisp-converter) | Official prose-to-AISP converter |
| AISP validation | [`aisp-validator`](https://www.npmjs.com/package/aisp-validator) | Official AISP quality validator (WASM kernel) |
| LLM | [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk) | Claude API for gap analysis + output generation |
| Persistence | Browser localStorage | No database needed for MVP |

---

## API Routes

| Endpoint | Input | Output | LLM? |
|----------|-------|--------|------|
| `POST /api/convert` | `{ prose }` | `{ output, tier, confidence, unmapped, tokens }` | No |
| `POST /api/analyze` | `{ prose }` | `{ aisp, validation, gaps[], summary }` | Yes |
| `POST /api/generate` | `{ prose, aisp, gaps[] }` | `{ finalSpec, vitestTests, playwrightTests }` | Yes |

- `/api/convert` is called on every keystroke (debounced 500ms) for the live preview. It uses deterministic Rosetta Stone mappings and requires no API key.
- `/api/analyze` and `/api/generate` call Claude (Sonnet) and require `ANTHROPIC_API_KEY` in `.env.local`.

---

## Gap Analysis

Claude analyzes specifications across 8 categories of incompleteness:

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

Each gap is assigned a severity (`critical`, `major`, `minor`), a question to ask the user, and an optional suggested answer. Critical and major gaps must be resolved before generating outputs; minor gaps can be skipped.

---

## Project Structure

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
│   │   ├── prompts.ts                  # Claude system/user prompts
│   │   ├── analyze.ts                  # Claude gap analysis module
│   │   ├── generate.ts                 # Claude output generation module
│   │   └── examples.ts                 # Built-in example specs
│   └── hooks/
│       └── useSpecFlow.ts              # useReducer state machine for 4-phase flow
```

---

## What is AISP?

[AISP](AI_GUIDE.md) (AI Symbolic Protocol) is a formal specification language that replaces ambiguous natural language with precise mathematical notation. It reduces ambiguity from 40-65% to under 2%.

| Natural Language | AISP Notation |
|------------------|---------------|
| "Define x as 5" | `x≜5` |
| "For all users, if admin then allow" | `∀u∈Users:admin(u)⇒allow(u)` |
| "There exists a valid solution" | `∃x:valid(x)` |

AISP documents are graded by semantic density (δ) into quality tiers:

| Symbol | Tier | Density |
|--------|------|---------|
| `◊⁺⁺` | Platinum | δ ≥ 0.75 |
| `◊⁺` | Gold | δ ≥ 0.60 |
| `◊` | Silver | δ ≥ 0.40 |
| `◊⁻` | Bronze | δ ≥ 0.20 |
| `⊘` | Reject | δ < 0.20 |

For more on AISP, see the [official specification](AI_GUIDE.md), [cheatsheet](CHEATSHEET.md), or [complete symbol reference](reference.md).

---

## AISP Reference Materials

This repository also includes the AISP open-core specification:

| Document | Purpose |
|----------|---------|
| [AI_GUIDE.md](AI_GUIDE.md) | Official AISP 5.1 Platinum Specification |
| [HUMAN_GUIDE.md](HUMAN_GUIDE.md) | Tutorial for humans learning AISP |
| [CHEATSHEET.md](CHEATSHEET.md) | Rosetta Stone quick reference |
| [reference.md](reference.md) | Complete 512-symbol glossary |
| [examples/](examples/) | CLI examples by tier |
| [evidence/](evidence/) | Real-world validation tests |
| [guides/advanced/](guides/advanced/) | Deep dive into AISP internals |
