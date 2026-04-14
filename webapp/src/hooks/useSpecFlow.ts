'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type {
  Phase,
  GapStatus,
  SpecFlowState,
  ConversionResult,
  AnalysisResult,
  GenerationResult,
  ValidationResult,
  ProseIntegration,
} from '@/lib/types';
import { EXAMPLES, type ExampleKey } from '@/lib/examples';

const STORAGE_KEY = 'aisp-specflow-prose';

function extractProseFromJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && typeof parsed.updated_specification === 'string') {
      return parsed.updated_specification.replace(/\\n/g, '\n');
    }
  } catch {
    // not JSON, return as-is
  }
  return text;
}

type Action =
  | { type: 'SET_PROSE'; prose: string }
  | { type: 'SET_PREVIEW'; preview: ConversionResult | null }
  | { type: 'START_ANALYZE' }
  | { type: 'ANALYZE_SUCCESS'; result: AnalysisResult }
  | { type: 'ANALYZE_ERROR'; error: string }
  | { type: 'UPDATE_GAP_ANSWER'; gapId: string; answer: string }
  | { type: 'GAP_ANALYZE_START'; gapId: string }
  | { type: 'GAP_ANALYZE_SUCCESS'; gapId: string; status: GapStatus; feedback: string }
  | { type: 'GAP_ANALYZE_ERROR'; gapId: string; error: string }
  | { type: 'GAP_INTEGRATE_START'; gapId: string }
  | {
      type: 'GAP_INTEGRATE_SUCCESS';
      gapId: string;
      updatedProse: string;
      aisp: string;
      validation: ValidationResult;
    }
  | { type: 'GAP_INTEGRATE_ERROR'; gapId: string }
  | { type: 'APPROVE_INTEGRATION' }
  | { type: 'REJECT_INTEGRATION' }
  | { type: 'RESTORE_VERSION'; state: SpecFlowState }
  | { type: 'START_GENERATE' }
  | { type: 'GENERATE_SUCCESS'; result: GenerationResult }
  | { type: 'GENERATE_ERROR'; error: string }
  | { type: 'GO_BACK'; toPhase: Phase }
  | { type: 'RESET' };

function createInitialState(): SpecFlowState {
  return {
    phase: 'write',
    prose: '',
    livePreview: null,
    analysis: null,
    gaps: [],
    generation: null,
    error: null,
    pendingIntegration: null,
  };
}

function reducer(state: SpecFlowState, action: Action): SpecFlowState {
  switch (action.type) {
    case 'SET_PROSE':
      return { ...state, prose: action.prose, error: null };

    case 'SET_PREVIEW':
      return { ...state, livePreview: action.preview };

    case 'START_ANALYZE':
      return { ...state, phase: 'analyzing', error: null };

    case 'ANALYZE_SUCCESS':
      return {
        ...state,
        phase: 'clarify',
        analysis: action.result,
        gaps: action.result.gaps,
      };

    case 'ANALYZE_ERROR':
      return { ...state, phase: 'write', error: action.error };

    case 'UPDATE_GAP_ANSWER':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId
            ? { ...g, answer: action.answer, status: 'pending' as GapStatus, feedback: undefined }
            : g,
        ),
      };

    case 'GAP_ANALYZE_START':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId ? { ...g, status: 'analyzing' as GapStatus } : g,
        ),
      };

    case 'GAP_ANALYZE_SUCCESS':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId
            ? { ...g, status: action.status, feedback: action.feedback }
            : g,
        ),
      };

    case 'GAP_ANALYZE_ERROR':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId
            ? { ...g, status: 'pending' as GapStatus, feedback: action.error }
            : g,
        ),
      };

    case 'GAP_INTEGRATE_START':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId ? { ...g, status: 'integrating' as GapStatus } : g,
        ),
      };

    case 'GAP_INTEGRATE_SUCCESS':
      return {
        ...state,
        pendingIntegration: {
          gapId: action.gapId,
          originalProse: state.prose,
          updatedProse: extractProseFromJson(action.updatedProse),
          aisp: action.aisp,
          validation: action.validation,
        },
      };

    case 'GAP_INTEGRATE_ERROR':
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.gapId ? { ...g, status: 'ready' as GapStatus } : g,
        ),
      };

    case 'APPROVE_INTEGRATION': {
      const pi = state.pendingIntegration;
      if (!pi) return state;
      return {
        ...state,
        prose: pi.updatedProse,
        pendingIntegration: null,
        analysis: state.analysis
          ? { ...state.analysis, aisp: pi.aisp, validation: pi.validation }
          : state.analysis,
        gaps: state.gaps.map((g) =>
          g.id === pi.gapId ? { ...g, status: 'integrated' as GapStatus } : g,
        ),
      };
    }

    case 'REJECT_INTEGRATION': {
      const pi = state.pendingIntegration;
      if (!pi) return state;
      return {
        ...state,
        pendingIntegration: null,
        gaps: state.gaps.map((g) =>
          g.id === pi.gapId ? { ...g, status: 'ready' as GapStatus } : g,
        ),
      };
    }

    case 'RESTORE_VERSION':
      return { ...action.state };

    case 'START_GENERATE':
      return { ...state, phase: 'generating', error: null };

    case 'GENERATE_SUCCESS':
      return {
        ...state,
        phase: 'output',
        generation: action.result,
      };

    case 'GENERATE_ERROR':
      return { ...state, phase: 'clarify', error: action.error };

    case 'GO_BACK':
      return { ...state, phase: action.toPhase, error: null };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

async function createVersionSnapshot(
  label: string,
  trigger: string,
  state: SpecFlowState,
): Promise<void> {
  await fetch('/api/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, trigger, state }),
  }).catch(() => {
    // versioning is best-effort
  });
}

export type UseSpecFlowReturn = {
  state: SpecFlowState;
  setProse: (prose: string) => void;
  analyze: () => Promise<void>;
  updateGapAnswer: (gapId: string, answer: string) => void;
  analyzeGap: (gapId: string) => Promise<void>;
  generate: () => Promise<void>;
  goBack: (toPhase: Phase) => void;
  loadExample: (key: ExampleKey) => void;
  reset: () => void;
  restoreVersion: (restoredState: SpecFlowState) => Promise<void>;
  approveIntegration: () => Promise<void>;
  rejectIntegration: () => void;
  allRequiredGapsAnswered: boolean;
};

export function useSpecFlow(): UseSpecFlowReturn {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate prose from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        dispatch({ type: 'SET_PROSE', prose: extractProseFromJson(saved) });
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Persist prose to localStorage
  useEffect(() => {
    if (!initializedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, state.prose);
    } catch {
      // quota exceeded or unavailable
    }
  }, [state.prose]);

  const fetchPreview = useCallback((prose: string) => {
    if (!prose.trim()) {
      dispatch({ type: 'SET_PREVIEW', preview: null });
      return;
    }

    fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prose }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          dispatch({ type: 'SET_PREVIEW', preview: data });
        }
      })
      .catch(() => {
        // preview is best-effort
      });
  }, []);

  const setProse = useCallback(
    (prose: string) => {
      dispatch({ type: 'SET_PROSE', prose });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPreview(prose), 500);
    },
    [fetchPreview],
  );

  const analyze = useCallback(async () => {
    await createVersionSnapshot('Before analysis', 'pre_analyze', stateRef.current);

    dispatch({ type: 'START_ANALYZE' });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prose: stateRef.current.prose }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({
          type: 'ANALYZE_ERROR',
          error: data.error ?? 'Analysis failed',
        });
        return;
      }
      dispatch({ type: 'ANALYZE_SUCCESS', result: data });
    } catch (err) {
      dispatch({
        type: 'ANALYZE_ERROR',
        error: err instanceof Error ? err.message : 'Analysis failed',
      });
    }
  }, []);

  const updateGapAnswer = useCallback((gapId: string, answer: string) => {
    dispatch({ type: 'UPDATE_GAP_ANSWER', gapId, answer });
  }, []);

  const analyzeGap = useCallback(
    async (gapId: string) => {
      const currentState = stateRef.current;
      const gap = currentState.gaps.find((g) => g.id === gapId);
      if (!gap?.answer?.trim()) return;

      dispatch({ type: 'GAP_ANALYZE_START', gapId });
      try {
        const res = await fetch('/api/analyze-gap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gap, prose: currentState.prose }),
        });
        const data = await res.json();
        if (!res.ok) {
          dispatch({
            type: 'GAP_ANALYZE_ERROR',
            gapId,
            error: data.error ?? 'Analysis failed',
          });
          return;
        }
        dispatch({
          type: 'GAP_ANALYZE_SUCCESS',
          gapId,
          status: data.status,
          feedback: data.feedback,
        });

        // Auto-trigger integration when gap is ready
        if (data.status === 'ready') {
          const latestState = stateRef.current;
          // Skip if another integration is already pending
          if (latestState.pendingIntegration) return;

          const resolvedGap = { ...gap, answer: gap.answer, status: 'ready' as GapStatus };
          dispatch({ type: 'GAP_INTEGRATE_START', gapId });

          try {
            const intRes = await fetch('/api/integrate-gap', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prose: latestState.prose, gap: resolvedGap }),
            });
            const intData = await intRes.json();
            if (intRes.ok) {
              dispatch({
                type: 'GAP_INTEGRATE_SUCCESS',
                gapId,
                updatedProse: intData.updatedProse,
                aisp: intData.aisp,
                validation: intData.validation,
              });
            } else {
              dispatch({ type: 'GAP_INTEGRATE_ERROR', gapId });
            }
          } catch {
            dispatch({ type: 'GAP_INTEGRATE_ERROR', gapId });
          }
        }
      } catch (err) {
        dispatch({
          type: 'GAP_ANALYZE_ERROR',
          gapId,
          error: err instanceof Error ? err.message : 'Analysis failed',
        });
      }
    },
    [],
  );

  const generate = useCallback(async () => {
    dispatch({ type: 'START_GENERATE' });
    try {
      const currentState = stateRef.current;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prose: currentState.prose,
          aisp: currentState.analysis?.aisp ?? '',
          gaps: currentState.gaps,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({
          type: 'GENERATE_ERROR',
          error: data.error ?? 'Generation failed',
        });
        return;
      }
      dispatch({ type: 'GENERATE_SUCCESS', result: data });

      // Snapshot after generation
      await createVersionSnapshot('After generation', 'post_generate', {
        ...stateRef.current,
        phase: 'output',
        generation: data,
      });
    } catch (err) {
      dispatch({
        type: 'GENERATE_ERROR',
        error: err instanceof Error ? err.message : 'Generation failed',
      });
    }
  }, []);

  const goBack = useCallback((toPhase: Phase) => {
    dispatch({ type: 'GO_BACK', toPhase });
  }, []);

  const loadExample = useCallback(
    (key: ExampleKey) => {
      const example = EXAMPLES[key];
      dispatch({ type: 'SET_PROSE', prose: example.prose });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchPreview(example.prose),
        300,
      );
    },
    [fetchPreview],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const restoreVersion = useCallback(async (restoredState: SpecFlowState) => {
    await createVersionSnapshot('Before rollback', 'rollback', stateRef.current);
    dispatch({ type: 'RESTORE_VERSION', state: restoredState });
  }, []);

  const approveIntegration = useCallback(async () => {
    const currentState = stateRef.current;
    const pi = currentState.pendingIntegration;
    if (!pi) return;

    const gapQuestion = currentState.gaps.find((g) => g.id === pi.gapId)?.question ?? 'gap';
    await createVersionSnapshot(
      `Before integrating: ${gapQuestion.slice(0, 60)}`,
      'gap_integrated',
      currentState,
    );
    dispatch({ type: 'APPROVE_INTEGRATION' });
  }, []);

  const rejectIntegration = useCallback(() => {
    dispatch({ type: 'REJECT_INTEGRATION' });
  }, []);

  const allRequiredGapsAnswered = state.gaps
    .filter((g) => g.severity === 'critical' || g.severity === 'major')
    .every(
      (g) =>
        g.status === 'integrated' || (g.answer && g.answer.trim().length > 0),
    );

  return {
    state,
    setProse,
    analyze,
    updateGapAnswer,
    analyzeGap,
    generate,
    goBack,
    loadExample,
    reset,
    restoreVersion,
    approveIntegration,
    rejectIntegration,
    allRequiredGapsAnswered,
  };
}
