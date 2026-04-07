'use client';

import { CodeBlock } from './CodeBlock';
import { QualityBadge } from './QualityBadge';
import { EXAMPLES, type ExampleKey } from '@/lib/examples';
import type { UseSpecFlowReturn } from '@/hooks/useSpecFlow';

type SpecEditorProps = {
  flow: UseSpecFlowReturn;
};

export function SpecEditor({ flow }: SpecEditorProps) {
  const { state, setProse, analyze, loadExample } = flow;
  const preview = state.livePreview;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (state.prose.trim()) analyze();
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Editor pane */}
        <div className="flex-[2] flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="prose-editor" className="text-sm text-gray-400">
              Product Specification
            </label>
            <span className="text-xs text-gray-500">
              {state.prose.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id="prose-editor"
            value={state.prose}
            onChange={(e) => setProse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your product specification in plain English...

Example: Build a tic-tac-toe game for two players. The game board is a 3x3 grid..."
            className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-100 placeholder-gray-600 font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            maxLength={10000}
          />
        </div>

        {/* Preview pane */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Live AISP Preview</span>
            {preview && (
              <QualityBadge
                tier={preview.tier === 'minimal' ? '◊⁻' : preview.tier === 'standard' ? '◊' : '◊⁺'}
                tierName={preview.tier}
                delta={preview.confidence}
              />
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {preview ? (
              <CodeBlock code={preview.output} language="aisp" copyable />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800 text-gray-600 text-sm">
                Start typing to see AISP preview...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex gap-2">
          {(Object.keys(EXAMPLES) as ExampleKey[]).map((key) => (
            <button
              key={key}
              onClick={() => loadExample(key)}
              className="px-3 py-1.5 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
            >
              Load: {EXAMPLES[key].name}
            </button>
          ))}
        </div>
        <button
          onClick={analyze}
          disabled={!state.prose.trim()}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Analyze Specification
          <span className="ml-2 text-xs opacity-60">⌘↵</span>
        </button>
      </div>
    </div>
  );
}
