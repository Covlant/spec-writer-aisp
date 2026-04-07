'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type {
  Phase,
  GapStatus,
  SpecFlowState,
  ConversionResult,
  AnalysisResult,
  GenerationResult,
} from '@/lib/types';
import { EXAMPLES, type ExampleKey } from '@/lib/examples';

const STORAGE_KEY = 'aisp-specflow-prose';

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
  allRequiredGapsAnswered: boolean;
};

export function useSpecFlow(): UseSpecFlowReturn {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Hydrate prose from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        dispatch({ type: 'SET_PROSE', prose: saved });
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
    dispatch({ type: 'START_ANALYZE' });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prose: state.prose }),
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
  }, [state.prose]);

  const updateGapAnswer = useCallback((gapId: string, answer: string) => {
    dispatch({ type: 'UPDATE_GAP_ANSWER', gapId, answer });
  }, []);

  const analyzeGap = useCallback(
    async (gapId: string) => {
      const gap = state.gaps.find((g) => g.id === gapId);
      if (!gap?.answer?.trim()) return;

      dispatch({ type: 'GAP_ANALYZE_START', gapId });
      try {
        const res = await fetch('/api/analyze-gap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gap, prose: state.prose }),
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
      } catch (err) {
        dispatch({
          type: 'GAP_ANALYZE_ERROR',
          gapId,
          error: err instanceof Error ? err.message : 'Analysis failed',
        });
      }
    },
    [state.gaps, state.prose],
  );

  const generate = useCallback(async () => {
    dispatch({ type: 'START_GENERATE' });
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prose: state.prose,
          aisp: state.analysis?.aisp ?? '',
          gaps: state.gaps,
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
    } catch (err) {
      dispatch({
        type: 'GENERATE_ERROR',
        error: err instanceof Error ? err.message : 'Generation failed',
      });
    }
  }, [state.prose, state.analysis, state.gaps]);

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

  const allRequiredGapsAnswered = state.gaps
    .filter((g) => g.severity === 'critical' || g.severity === 'major')
    .every((g) => g.answer && g.answer.trim().length > 0);

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
    allRequiredGapsAnswered,
  };
}
