'use client';

import { DiffView } from './DiffView';
import type { ProseIntegration, Gap } from '@/lib/types';

type IntegrationDiffModalProps = {
  integration: ProseIntegration;
  gap: Gap;
  onApprove: () => void;
  onReject: () => void;
};

export function IntegrationDiffModal({
  integration,
  gap,
  onApprove,
  onReject,
}: IntegrationDiffModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onReject();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-200">
              Integrate Gap Resolution
            </h2>
            <button
              onClick={onReject}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-400">{gap.question}</p>
          <p className="text-xs text-gray-600 mt-1">
            Answer: {gap.answer}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <DiffView
            oldText={integration.originalProse}
            newText={integration.updatedProse}
            oldLabel="Current Spec"
            newLabel="With Gap Integrated"
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors cursor-pointer"
          >
            Approve & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
