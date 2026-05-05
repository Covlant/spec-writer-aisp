'use client';

import type { DetailLevel } from '@/lib/types';
import { DETAIL_LEVEL_LABELS } from '@/lib/types';
import { DETAIL_LEVELS } from '@/lib/detail-level';

type DetailDialProps = {
  value: DetailLevel;
  onChange: (level: DetailLevel) => void;
  size?: 'md' | 'sm';
  showLabels?: boolean;
  followGlobal?: boolean;
  onFollowGlobal?: () => void;
};

export function DetailDial({
  value,
  onChange,
  size = 'md',
  showLabels = true,
  followGlobal,
  onFollowGlobal,
}: DetailDialProps) {
  const segH = size === 'sm' ? 'h-6 text-[10px]' : 'h-8 text-xs';

  return (
    <div className="flex flex-col gap-1">
      <div
        role="radiogroup"
        aria-label="Detail level"
        className="inline-flex rounded-md border border-gray-700 bg-gray-900 overflow-hidden"
      >
        {DETAIL_LEVELS.map((lvl) => {
          const active = !followGlobal && value === lvl;
          return (
            <button
              key={lvl}
              role="radio"
              aria-checked={active}
              aria-label={`Level ${lvl}: ${DETAIL_LEVEL_LABELS[lvl]}`}
              onClick={() => onChange(lvl)}
              className={`${segH} px-2 font-medium transition-colors cursor-pointer border-r border-gray-700 last:border-r-0 ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              L{lvl}
            </button>
          );
        })}
        {onFollowGlobal && (
          <button
            onClick={onFollowGlobal}
            aria-pressed={!!followGlobal}
            className={`${segH} px-2 font-medium transition-colors cursor-pointer border-l border-gray-700 ${
              followGlobal
                ? 'bg-gray-700 text-gray-200'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
            }`}
            title="Follow global detail level"
          >
            Auto
          </button>
        )}
      </div>
      {showLabels && (
        <div className="text-[10px] text-gray-500">
          {followGlobal ? 'Following global' : DETAIL_LEVEL_LABELS[value]}
        </div>
      )}
    </div>
  );
}
