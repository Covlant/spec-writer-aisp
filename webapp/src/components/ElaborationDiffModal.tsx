'use client';

import { useState } from 'react';
import type { DetailLevel, SpecItem } from '@/lib/types';
import { DETAIL_LEVEL_LABELS } from '@/lib/types';

type ElaborationDiffModalProps = {
  item: SpecItem;
  targetLevel: DetailLevel;
  sourceLevel: DetailLevel | 0;
  sourceContent: string;
  draft: string;
  onAccept: (content: string) => void;
  onClose: () => void;
};

export function ElaborationDiffModal({
  item,
  targetLevel,
  sourceLevel,
  sourceContent,
  draft,
  onAccept,
  onClose,
}: ElaborationDiffModalProps) {
  const [editedDraft, setEditedDraft] = useState(draft);
  const [editing, setEditing] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-200">
              Elaborate to L{targetLevel} &middot; {DETAIL_LEVEL_LABELS[targetLevel]}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-400">{item.title}</p>
        </div>

        <div className="flex-1 overflow-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500">
              {sourceLevel === 0
                ? 'No prior content'
                : `Current L${sourceLevel} · ${DETAIL_LEVEL_LABELS[sourceLevel]}`}
            </div>
            <pre className="flex-1 bg-gray-950 border border-gray-800 rounded-md p-3 text-sm text-gray-300 whitespace-pre-wrap font-sans overflow-auto">
              {sourceContent || <span className="text-gray-600">(empty)</span>}
            </pre>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400">
                AI draft &middot; L{targetLevel}
              </span>
              <button
                onClick={() => setEditing((e) => !e)}
                className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                {editing ? 'Preview' : 'Edit'}
              </button>
            </div>
            {editing ? (
              <textarea
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                className="flex-1 bg-gray-950 border border-blue-500/40 rounded-md p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500"
              />
            ) : (
              <pre className="flex-1 bg-gray-950 border border-blue-500/30 rounded-md p-3 text-sm text-gray-200 whitespace-pre-wrap font-sans overflow-auto">
                {editedDraft || <span className="text-gray-600">(empty draft)</span>}
              </pre>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={() => onAccept(editedDraft)}
            disabled={!editedDraft.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Accept &amp; Save L{targetLevel}
          </button>
        </div>
      </div>
    </div>
  );
}
