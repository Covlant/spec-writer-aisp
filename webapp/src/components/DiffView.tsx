'use client';

import { useMemo } from 'react';
import { diffLines } from 'diff';

type DiffViewProps = {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
};

export function DiffView({
  oldText,
  newText,
  oldLabel = 'Original',
  newLabel = 'Updated',
}: DiffViewProps) {
  const changes = useMemo(() => diffLines(oldText, newText), [oldText, newText]);

  const hasChanges = changes.some((c) => c.added || c.removed);

  if (!hasChanges) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center bg-gray-900 rounded-lg border border-gray-800">
        No changes
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex text-xs border-b border-gray-800 bg-gray-900">
        <span className="px-3 py-1.5 text-red-400">{oldLabel}</span>
        <span className="px-3 py-1.5 text-green-400 border-l border-gray-800">
          {newLabel}
        </span>
      </div>
      <pre className="text-sm font-mono overflow-x-auto max-h-[60vh] overflow-y-auto">
        {changes.map((change, i) => {
          const lines = change.value.replace(/\n$/, '').split('\n');
          return lines.map((line, j) => {
            const key = `${i}-${j}`;
            if (change.added) {
              return (
                <div key={key} className="bg-green-500/15 text-green-300">
                  <span className="inline-block w-8 text-center text-green-600 select-none">
                    +
                  </span>
                  {line}
                </div>
              );
            }
            if (change.removed) {
              return (
                <div key={key} className="bg-red-500/15 text-red-300 line-through">
                  <span className="inline-block w-8 text-center text-red-600 select-none">
                    -
                  </span>
                  {line}
                </div>
              );
            }
            return (
              <div key={key} className="text-gray-400">
                <span className="inline-block w-8 text-center text-gray-700 select-none">
                  {' '}
                </span>
                {line}
              </div>
            );
          });
        })}
      </pre>
    </div>
  );
}
