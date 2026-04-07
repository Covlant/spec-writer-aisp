'use client';

import { useState, useCallback } from 'react';

type CodeBlockProps = {
  code: string;
  language?: 'aisp' | 'typescript' | 'markdown';
  copyable?: boolean;
};

function highlightAisp(code: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Block markers
  html = html.replace(
    /⟦[ΩΣΓΛΧΕε][^⟧]*⟧/g,
    '<span style="color:#60a5fa;font-weight:600">$&</span>',
  );

  // Symbols
  html = html.replace(
    /[∀∃∄≜≔≡≢⇒⇔→↦λ∧∨¬⊕∈∉⊆⊇∪∩∅⟨⟩⊤⊥∎⊢⊨□◇≤≥≈]/g,
    '<span style="color:#22d3ee">$&</span>',
  );

  // Tier symbols
  html = html.replace(
    /◊⁺⁺|◊⁺|◊⁻|◊|⊘/g,
    '<span style="color:#fbbf24;font-weight:600">$&</span>',
  );

  // Greek letters for density/completeness/tier
  html = html.replace(
    /[δφτγ]/g,
    '<span style="color:#a78bfa">$&</span>',
  );

  // AISP header
  html = html.replace(
    /𝔸[\d.]+\.[^\n]*/g,
    '<span style="color:#34d399">$&</span>',
  );

  return html;
}

export function CodeBlock({ code, language, copyable = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const displayHtml =
    language === 'aisp'
      ? highlightAisp(code)
      : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return (
    <div className="relative group rounded-lg overflow-hidden">
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <pre className="bg-gray-900 p-4 overflow-x-auto text-sm leading-relaxed">
        <code
          className="font-mono"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      </pre>
    </div>
  );
}
