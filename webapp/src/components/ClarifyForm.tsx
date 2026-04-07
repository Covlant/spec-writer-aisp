'use client';

import { useState } from 'react';
import { QualityBadge } from './QualityBadge';
import { CodeBlock } from './CodeBlock';
import type { UseSpecFlowReturn } from '@/hooks/useSpecFlow';
import type { GapStatus } from '@/lib/types';

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

const STATUS_INDICATOR: Record<GapStatus, { label: string; className: string }> = {
  pending: { label: '', className: '' },
  analyzing: { label: 'Analyzing...', className: 'text-blue-400' },
  needs_refinement: { label: 'Needs refinement', className: 'text-amber-400' },
  ready: { label: 'Ready', className: 'text-green-400' },
};

function AispModal({
  aisp,
  onClose,
}: {
  aisp: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-200">
            AISP Conversion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <CodeBlock code={aisp} language="aisp" copyable />
        </div>
      </div>
    </div>
  );
}

export function ClarifyForm({ flow }: ClarifyFormProps) {
  const {
    state,
    updateGapAnswer,
    analyzeGap,
    generate,
    goBack,
    allRequiredGapsAnswered,
  } = flow;
  const { analysis, gaps } = state;
  const [showAispModal, setShowAispModal] = useState(false);

  const answeredCount = gaps.filter(
    (g) => g.answer && g.answer.trim().length > 0,
  ).length;
  const requiredCount = gaps.filter(
    (g) => g.severity === 'critical' || g.severity === 'major',
  ).length;
  const requiredAnswered = gaps
    .filter((g) => g.severity === 'critical' || g.severity === 'major')
    .filter((g) => g.answer && g.answer.trim().length > 0).length;
  const readyCount = gaps.filter((g) => g.status === 'ready').length;

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
              {readyCount > 0 && (
                <span className="text-green-400">
                  {' '}
                  &middot; {readyCount} ready
                </span>
              )}
            </span>
          </div>
        </div>
        {analysis?.aisp && (
          <button
            onClick={() => setShowAispModal(true)}
            className="px-3 py-1.5 text-sm rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors cursor-pointer"
          >
            View AISP
          </button>
        )}
      </div>

      {/* AISP modal */}
      {showAispModal && analysis?.aisp && (
        <AispModal
          aisp={analysis.aisp}
          onClose={() => setShowAispModal(false)}
        />
      )}

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
          &larr; Back to Editor
        </button>
      </div>

      {/* Gap cards */}
      <div className="flex flex-col gap-4">
        {sorted.map((gap) => {
          const statusInfo = STATUS_INDICATOR[gap.status];
          const canAnalyze =
            gap.answer?.trim() && gap.status !== 'analyzing';

          return (
            <div
              key={gap.id}
              className={`p-4 bg-gray-900 rounded-lg border ${
                gap.status === 'ready'
                  ? 'border-green-500/30'
                  : gap.status === 'needs_refinement'
                    ? 'border-amber-500/30'
                    : 'border-gray-800'
              }`}
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
                  <span className="text-xs text-gray-600">
                    &bull; {gap.location}
                  </span>
                )}
                {statusInfo.label && (
                  <span className={`text-xs font-medium ml-auto ${statusInfo.className}`}>
                    {gap.status === 'analyzing' && (
                      <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1 align-middle" />
                    )}
                    {gap.status === 'ready' && '✓ '}
                    {gap.status === 'needs_refinement' && '⚠ '}
                    {statusInfo.label}
                  </span>
                )}
              </div>

              <label
                htmlFor={`gap-${gap.id}`}
                className="block text-gray-200 font-medium mb-1"
              >
                {gap.question}
              </label>
              <p className="text-sm text-gray-500 mb-3">{gap.context}</p>

              <div className="flex gap-2 items-start">
                <textarea
                  id={`gap-${gap.id}`}
                  value={gap.answer ?? ''}
                  onChange={(e) => updateGapAnswer(gap.id, e.target.value)}
                  placeholder={gap.suggestion ?? 'Your answer...'}
                  rows={2}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => analyzeGap(gap.id)}
                  disabled={!canAnalyze}
                  className="px-3 py-2.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {gap.status === 'analyzing' ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>

              {/* Feedback from gap analysis */}
              {gap.feedback && gap.status !== 'pending' && (
                <div
                  className={`mt-3 p-3 rounded-md text-sm ${
                    gap.status === 'ready'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                  }`}
                >
                  {gap.feedback}
                </div>
              )}

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
          );
        })}
      </div>

      {/* Generate button */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="text-sm text-gray-500">
          {!allRequiredGapsAnswered
            ? 'Answer all critical and major gaps to continue'
            : 'Ready to generate outputs'}
        </div>
        <button
          onClick={generate}
          disabled={!allRequiredGapsAnswered}
          className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Generate Outputs
          <span className="ml-2 text-xs opacity-60">&thinsp;&#8984;&#8629;</span>
        </button>
      </div>
    </div>
  );
}
