'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiffView } from './DiffView';
import type { SpecFlowState } from '@/lib/types';
import type { VersionSummary, VersionFull } from '@/lib/db';

type VersionHistoryModalProps = {
  onClose: () => void;
  onRestore: (state: SpecFlowState) => void;
  currentState: SpecFlowState;
};

const TRIGGER_BADGE: Record<string, { label: string; className: string }> = {
  pre_analyze: { label: 'Pre-Analysis', className: 'bg-blue-500/20 text-blue-400' },
  gap_integrated: { label: 'Gap Integrated', className: 'bg-green-500/20 text-green-400' },
  post_generate: { label: 'Generated', className: 'bg-purple-500/20 text-purple-400' },
  rollback: { label: 'Rollback', className: 'bg-amber-500/20 text-amber-400' },
  manual: { label: 'Manual', className: 'bg-gray-500/20 text-gray-400' },
};

function formatTime(iso: string): string {
  const d = new Date(iso + 'Z');
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function VersionHistoryModal({
  onClose,
  onRestore,
  currentState,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionFull | null>(null);
  const [previousVersion, setPreviousVersion] = useState<VersionFull | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  useEffect(() => {
    fetch('/api/versions')
      .then((res) => res.json())
      .then((data) => {
        setVersions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectVersion = useCallback(
    async (id: number) => {
      setSelectedId(id);
      setLoadingVersion(true);
      setSelectedVersion(null);
      setPreviousVersion(null);

      try {
        const res = await fetch(`/api/versions/${id}`);
        const ver = (await res.json()) as VersionFull;
        setSelectedVersion(ver);

        // Find the previous version in the list for diffing
        const idx = versions.findIndex((v) => v.id === id);
        if (idx < versions.length - 1) {
          const prevId = versions[idx + 1].id;
          const prevRes = await fetch(`/api/versions/${prevId}`);
          const prevVer = (await prevRes.json()) as VersionFull;
          setPreviousVersion(prevVer);
        }
      } catch {
        // failed to load
      } finally {
        setLoadingVersion(false);
      }
    },
    [versions],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-200">
            Version History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: version list */}
          <div className="w-72 shrink-0 border-r border-gray-800 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                No versions yet
              </div>
            ) : (
              <div className="flex flex-col">
                {versions.map((v) => {
                  const badge = TRIGGER_BADGE[v.trigger] ?? TRIGGER_BADGE.manual;
                  return (
                    <button
                      key={v.id}
                      onClick={() => selectVersion(v.id)}
                      className={`w-full text-left p-3 border-b border-gray-800 transition-colors cursor-pointer ${
                        selectedId === v.id
                          ? 'bg-gray-800'
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {v.phase}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {v.label}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {formatTime(v.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: version detail + diff */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selectedVersion && !loadingVersion && (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Select a version to view details
              </div>
            )}

            {loadingVersion && (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {selectedVersion && !loadingVersion && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">
                      {selectedVersion.label}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatTime(selectedVersion.createdAt)} &bull; Phase:{' '}
                      {selectedVersion.phase}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onRestore(selectedVersion.state);
                    }}
                    className="px-4 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors cursor-pointer"
                  >
                    Restore This Version
                  </button>
                </div>

                <div>
                  <h4 className="text-xs text-gray-500 mb-2">
                    Prose diff{' '}
                    {previousVersion
                      ? `(vs. v${previousVersion.id})`
                      : '(first version)'}
                  </h4>
                  <DiffView
                    oldText={previousVersion?.state.prose ?? ''}
                    newText={selectedVersion.state.prose}
                    oldLabel={
                      previousVersion
                        ? `v${previousVersion.id}`
                        : 'Empty'
                    }
                    newLabel={`v${selectedVersion.id}`}
                  />
                </div>

                {selectedVersion.state.gaps.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2">
                      Gaps at this version ({selectedVersion.state.gaps.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVersion.state.gaps.map((g) => (
                        <span
                          key={g.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            g.status === 'integrated'
                              ? 'border-emerald-500/30 text-emerald-400'
                              : g.status === 'ready'
                                ? 'border-green-500/30 text-green-400'
                                : 'border-gray-700 text-gray-500'
                          }`}
                        >
                          {g.severity}: {g.question.slice(0, 40)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
