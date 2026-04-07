'use client';

import { QualityBadge } from './QualityBadge';
import { CodeBlock } from './CodeBlock';
import type { UseSpecFlowReturn } from '@/hooks/useSpecFlow';

type ClarifyFormProps = {
  flow: UseSpecFlowReturn;
};

const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  major: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  minor: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  ambiguous_term: 'Ambiguous Term',
  missing_definition: 'Missing Definition',
  incomplete_rule: 'Incomplete Rule',
  undefined_type: 'Undefined Type',
  missing_error_case: 'Missing Error Case',
  missing_edge_case: 'Missing Edge Case',
  conflicting_rule: 'Conflicting Rule',
  unquantified_statement: 'Unquantified Statement',
};

export function ClarifyForm({ flow }: ClarifyFormProps) {
  const { state, updateGapAnswer, generate, goBack, allRequiredGapsAnswered } =
    flow;
  const { analysis, gaps } = state;

  const answeredCount = gaps.filter(
    (g) => g.answer && g.answer.trim().length > 0,
  ).length;
  const requiredCount = gaps.filter(
    (g) => g.severity === 'critical' || g.severity === 'major',
  ).length;
  const requiredAnswered = gaps
    .filter((g) => g.severity === 'critical' || g.severity === 'major')
    .filter((g) => g.answer && g.answer.trim().length > 0).length;

  const sorted = [...gaps].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return order[a.severity] - order[b.severity];
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (allRequiredGapsAnswered) generate();
    }
  };

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
      {/* Summary header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex flex-col gap-2">
          <p className="text-gray-300">{analysis?.summary}</p>
          <div className="flex items-center gap-3">
            {analysis?.validation && (
              <QualityBadge
                tier={analysis.validation.tier}
                tierName={analysis.validation.tierName}
                delta={analysis.validation.delta}
              />
            )}
            <span className="text-sm text-gray-500">
              {gaps.length} gap{gaps.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
        {analysis?.aisp && (
          <details className="text-sm">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
              View AISP
            </summary>
            <div className="mt-2 max-h-48 overflow-auto">
              <CodeBlock code={analysis.aisp} language="aisp" />
            </div>
          </details>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {answeredCount} of {gaps.length} gaps answered
          {requiredCount > 0 && (
            <span className="text-gray-500">
              {' '}
              ({requiredAnswered}/{requiredCount} required)
            </span>
          )}
        </span>
        <button
          onClick={() => goBack('write')}
          className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          ← Back to Editor
        </button>
      </div>

      {/* Gap cards */}
      <div className="flex flex-col gap-4">
        {sorted.map((gap) => (
          <div
            key={gap.id}
            className="p-4 bg-gray-900 rounded-lg border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_STYLES[gap.severity]}`}
              >
                {gap.severity}
              </span>
              <span className="text-xs text-gray-500">
                {CATEGORY_LABELS[gap.category] ?? gap.category}
              </span>
              {gap.location && (
                <span className="text-xs text-gray-600">• {gap.location}</span>
              )}
            </div>

            <label
              htmlFor={`gap-${gap.id}`}
              className="block text-gray-200 font-medium mb-1"
            >
              {gap.question}
            </label>
            <p className="text-sm text-gray-500 mb-3">{gap.context}</p>

            <textarea
              id={`gap-${gap.id}`}
              value={gap.answer ?? ''}
              onChange={(e) => updateGapAnswer(gap.id, e.target.value)}
              placeholder={gap.suggestion ?? 'Your answer...'}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            {gap.suggestion && !gap.answer && (
              <button
                onClick={() => updateGapAnswer(gap.id, gap.suggestion!)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Use suggestion: &ldquo;{gap.suggestion.slice(0, 80)}
                {gap.suggestion.length > 80 ? '...' : ''}&rdquo;
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="text-sm text-gray-500">
          {!allRequiredGapsAnswered
            ? `Answer all critical and major gaps to continue`
            : 'Ready to generate outputs'}
        </div>
        <button
          onClick={generate}
          disabled={!allRequiredGapsAnswered}
          className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Generate Outputs
          <span className="ml-2 text-xs opacity-60">⌘↵</span>
        </button>
      </div>
    </div>
  );
}
