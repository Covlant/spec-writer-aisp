'use client';

import { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import type { UseSpecFlowReturn } from '@/hooks/useSpecFlow';

type OutputViewProps = {
  flow: UseSpecFlowReturn;
};

type Tab = 'spec' | 'unit' | 'e2e';

const TABS: { key: Tab; label: string }[] = [
  { key: 'spec', label: 'Final Spec' },
  { key: 'unit', label: 'Unit Tests' },
  { key: 'e2e', label: 'E2E Tests' },
];

function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const html: string[] = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      html.push(
        `<h3 class="text-lg font-semibold text-gray-200 mt-6 mb-2">${line.slice(4)}</h3>`,
      );
    } else if (line.startsWith('## ')) {
      html.push(
        `<h2 class="text-xl font-bold text-gray-100 mt-8 mb-3">${line.slice(3)}</h2>`,
      );
    } else if (line.startsWith('# ')) {
      html.push(
        `<h1 class="text-2xl font-bold text-white mt-8 mb-4">${line.slice(2)}</h1>`,
      );
    } else if (line.startsWith('- ')) {
      html.push(
        `<li class="ml-4 text-gray-300 list-disc">${line.slice(2)}</li>`,
      );
    } else if (/^\d+\.\s/.test(line)) {
      html.push(
        `<li class="ml-4 text-gray-300 list-decimal">${line.replace(/^\d+\.\s/, '')}</li>`,
      );
    } else if (line.trim() === '') {
      html.push('<br/>');
    } else {
      const escaped = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-100">$1</strong>')
        .replace(/`(.+?)`/g, '<code class="bg-gray-800 px-1 rounded text-sm font-mono">$1</code>');
      html.push(`<p class="text-gray-300 leading-relaxed">${escaped}</p>`);
    }
  }

  return html.join('\n');
}

export function OutputView({ flow }: OutputViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('spec');
  const { state, reset, goBack } = flow;
  const gen = state.generation;

  if (!gen) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'spec' && (
          <div
            className="prose prose-invert max-w-none p-4 bg-gray-900 rounded-lg"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(gen.finalSpec) }}
          />
        )}
        {activeTab === 'unit' && (
          <CodeBlock code={gen.vitestTests} language="typescript" copyable />
        )}
        {activeTab === 'e2e' && (
          <CodeBlock
            code={gen.playwrightTests}
            language="typescript"
            copyable
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <button
          onClick={() => goBack('clarify')}
          className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          ← Back to Clarify
        </button>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors cursor-pointer"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
