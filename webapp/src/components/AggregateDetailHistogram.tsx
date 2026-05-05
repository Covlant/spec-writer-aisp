'use client';

import type { DetailLevel } from '@/lib/types';
import { DETAIL_LEVEL_LABELS } from '@/lib/types';
import { DETAIL_LEVELS, type LevelDistribution } from '@/lib/detail-level';

type AggregateDetailHistogramProps = {
  distribution: LevelDistribution;
  total: number;
  average: number;
  selectedLevel: DetailLevel | null;
  onSelectLevel: (level: DetailLevel | null) => void;
};

export function AggregateDetailHistogram({
  distribution,
  total,
  average,
  selectedLevel,
  onSelectLevel,
}: AggregateDetailHistogramProps) {
  const max = Math.max(1, ...DETAIL_LEVELS.map((l) => distribution[l]));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-1 h-12">
        {DETAIL_LEVELS.map((lvl) => {
          const count = distribution[lvl];
          const heightPct = (count / max) * 100;
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => onSelectLevel(isSelected ? null : lvl)}
              title={`${count} item${count === 1 ? '' : 's'} at L${lvl} (${DETAIL_LEVEL_LABELS[lvl]})`}
              className="flex-1 flex flex-col items-stretch justify-end h-full cursor-pointer group"
            >
              <div
                className={`rounded-t w-full transition-colors ${
                  isSelected
                    ? 'bg-blue-500'
                    : count === 0
                      ? 'bg-gray-800 group-hover:bg-gray-700'
                      : 'bg-gray-600 group-hover:bg-gray-500'
                }`}
                style={{ height: `${count === 0 ? 4 : heightPct}%`, minHeight: count === 0 ? 2 : 4 }}
              />
              <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-400' : 'text-gray-600'}`}>
                L{lvl}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-gray-500 flex items-center justify-between">
        <span>{total} item{total === 1 ? '' : 's'}</span>
        {total > 0 && <span>avg L{average.toFixed(1)}</span>}
      </div>
    </div>
  );
}
