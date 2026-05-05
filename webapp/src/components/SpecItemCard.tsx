'use client';

import { useState } from 'react';
import type { DetailLevel, SpecItem } from '@/lib/types';
import { DETAIL_LEVEL_LABELS } from '@/lib/types';
import {
  getItemMaxFilledLevel,
  getItemRenderedContent,
  getItemRenderedLevel,
} from '@/lib/detail-level';
import { DetailDial } from './DetailDial';
import { ElaborationDiffModal } from './ElaborationDiffModal';

const KIND_BADGE: Record<NonNullable<SpecItem['kind']>, string> = {
  requirement: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  behavior: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  constraint: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  note: 'bg-gray-500/10 border-gray-500/30 text-gray-300',
};

type SpecItemCardProps = {
  item: SpecItem;
  globalLevel: DetailLevel;
  onSetOverride: (level: DetailLevel | undefined) => void;
  onUpsertContent: (level: DetailLevel, content: string) => void;
  onElaborate: (
    targetLevel: DetailLevel,
  ) => Promise<{ draft: string; sourceLevel: DetailLevel | 0 } | null>;
  onRemove?: () => void;
};

export function SpecItemCard({
  item,
  globalLevel,
  onSetOverride,
  onUpsertContent,
  onElaborate,
  onRemove,
}: SpecItemCardProps) {
  const renderedLevel = getItemRenderedLevel(item, globalLevel);
  const maxFilled = getItemMaxFilledLevel(item);
  const { level: shownLevel, content } = getItemRenderedContent(item, globalLevel);
  const needsElaboration = renderedLevel > maxFilled && maxFilled > 0;
  const isEmpty = maxFilled === 0;

  const [elaborating, setElaborating] = useState(false);
  const [draft, setDraft] = useState<{
    draft: string;
    sourceLevel: DetailLevel | 0;
    sourceContent: string;
  } | null>(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  const handleAddDetail = async () => {
    setElaborating(true);
    const result = await onElaborate(renderedLevel);
    setElaborating(false);
    if (!result) return;
    const sourceContent =
      result.sourceLevel === 0 ? '' : (item.levels[result.sourceLevel] ?? '');
    setDraft({ ...result, sourceContent });
  };

  const handleAccept = (acceptedContent: string) => {
    onUpsertContent(renderedLevel, acceptedContent);
    setDraft(null);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.kind && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border ${KIND_BADGE[item.kind]}`}
              >
                {item.kind}
              </span>
            )}
            <span className="text-gray-200 font-medium truncate">
              {item.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
            <span>
              Showing L{shownLevel || '—'}
              {maxFilled > 0 && (
                <span className="text-gray-600"> / L{maxFilled} max</span>
              )}
            </span>
            {item.viewOverride !== undefined && (
              <span className="text-amber-400">overridden</span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOverrideMenu((s) => !s)}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 cursor-pointer"
          >
            L{renderedLevel}
            <span className="ml-1 text-gray-600">▾</span>
          </button>
          {showOverrideMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 p-2 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
              <DetailDial
                size="sm"
                showLabels={false}
                value={item.viewOverride ?? globalLevel}
                followGlobal={item.viewOverride === undefined}
                onChange={(lvl) => {
                  onSetOverride(lvl);
                  setShowOverrideMenu(false);
                }}
                onFollowGlobal={() => {
                  onSetOverride(undefined);
                  setShowOverrideMenu(false);
                }}
              />
            </div>
          )}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-600 hover:text-red-400 cursor-pointer text-sm"
            title="Remove item"
            aria-label="Remove item"
          >
            ×
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="text-sm text-gray-600 italic">No content yet.</div>
      ) : (
        <div className="text-sm text-gray-300 whitespace-pre-wrap">{content}</div>
      )}

      {needsElaboration && (
        <button
          onClick={handleAddDetail}
          disabled={elaborating}
          className="mt-3 px-3 py-1.5 text-xs rounded-md bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-60 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {elaborating ? (
            <span className="inline-block w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin align-middle" />
          ) : (
            <>+ Add L{renderedLevel} detail ({DETAIL_LEVEL_LABELS[renderedLevel]})</>
          )}
        </button>
      )}

      {draft && (
        <ElaborationDiffModal
          item={item}
          targetLevel={renderedLevel}
          sourceLevel={draft.sourceLevel}
          sourceContent={draft.sourceContent}
          draft={draft.draft}
          onAccept={handleAccept}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}
