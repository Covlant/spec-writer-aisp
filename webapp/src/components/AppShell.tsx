'use client';

import { SpecEditor } from './SpecEditor';
import { AnalysisView } from './AnalysisView';
import { ClarifyForm } from './ClarifyForm';
import { OutputView } from './OutputView';
import type { UseSpecFlowReturn } from '@/hooks/useSpecFlow';

type AppShellProps = {
  flow: UseSpecFlowReturn;
};

const PHASE_STEPS = [
  { key: 'write', label: 'Write' },
  { key: 'analyze', label: 'Analyze' },
  { key: 'clarify', label: 'Clarify' },
  { key: 'generate', label: 'Generate' },
] as const;

function phaseIndex(phase: string): number {
  if (phase === 'write') return 0;
  if (phase === 'analyzing') return 1;
  if (phase === 'clarify') return 2;
  if (phase === 'generating' || phase === 'output') return 3;
  return 0;
}

function GeneratingView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg text-gray-300">Generating outputs</p>
      <p className="text-sm text-gray-500">
        Creating final spec, unit tests, and E2E tests...
      </p>
    </div>
  );
}

export function AppShell({ flow }: AppShellProps) {
  const { state, reset } = flow;
  const currentIndex = phaseIndex(state.phase);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">AISP Spec Writer</h1>
        {state.phase !== 'write' && (
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Start Over
          </button>
        )}
      </header>

      {/* Phase stepper */}
      <nav className="flex items-center gap-2 mb-8" aria-label="Progress">
        {PHASE_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-px ${i <= currentIndex ? 'bg-blue-500' : 'bg-gray-700'}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  i < currentIndex
                    ? 'bg-blue-600 text-white'
                    : i === currentIndex
                      ? 'bg-blue-500 text-white ring-2 ring-blue-400/30'
                      : 'bg-gray-800 text-gray-500'
                }`}
                aria-current={i === currentIndex ? 'step' : undefined}
              >
                {i < currentIndex ? '✓' : i + 1}
              </div>
              <span
                className={`text-sm ${i <= currentIndex ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </nav>

      {/* Error banner */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {state.error}
        </div>
      )}

      {/* Phase content */}
      <div className="flex-1">
        {state.phase === 'write' && <SpecEditor flow={flow} />}
        {state.phase === 'analyzing' && <AnalysisView />}
        {state.phase === 'clarify' && <ClarifyForm flow={flow} />}
        {state.phase === 'generating' && <GeneratingView />}
        {state.phase === 'output' && <OutputView flow={flow} />}
      </div>
    </div>
  );
}
