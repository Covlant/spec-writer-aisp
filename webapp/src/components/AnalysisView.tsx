'use client';

import { useEffect, useState } from 'react';

export function AnalysisView() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const steps = [
    'Converting to AISP...',
    'Validating structure...',
    'Identifying gaps with AI...',
  ];

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg text-gray-300">Analyzing your specification</p>
      <div className="flex flex-col gap-2 mt-4">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            {i < step ? (
              <span className="text-green-400 w-5 text-center">✓</span>
            ) : i === step ? (
              <span className="text-blue-400 w-5 text-center animate-pulse">
                ●
              </span>
            ) : (
              <span className="text-gray-600 w-5 text-center">○</span>
            )}
            <span className={i <= step ? 'text-gray-300' : 'text-gray-600'}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
