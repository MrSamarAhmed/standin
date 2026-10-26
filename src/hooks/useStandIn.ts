import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useWorkerScanner } from './useWorkerScanner';
import { addCustomCastEntry, acceptedEntries, buildCast, cloneCast, sameAcceptedCast } from '../lib/cast';
import { chunkText } from '../lib/chunk';
import { mergeDetections } from '../lib/detections';
import { checkLeaks } from '../lib/leakCheck';
import { findPatternDetections } from '../lib/patterns';
import { restoreTokens } from '../lib/restore';
import { SAMPLE_TEXT } from '../lib/sample';
import { tokenizeDocument } from '../lib/tokenize';
import {
  CHAR_LIMIT,
  type CastEntry,
  type Detection,
  type DialogState,
  type ModelDetector,
  type ModelStatus,
  type RestoredSegment,
  type RestoreReport,
  type SafeSnapshot,
  type ScanPhase,
  type Step,
  type ToastMessage,
} from '../lib/types';

interface State {
  step: Step;
  rawText: string;
  documentLabel: string | null;
  sampleLoaded: boolean;
  isEditing: boolean;
  scanPhase: ScanPhase;
  scanError: string | null;
  modelStatus: ModelStatus;
  modelProgress: number | null;
  detections: Detection[];
  cast: CastEntry[];
  safeCopy: SafeSnapshot | null;
  unprotectedAck: boolean;
  copyAck: boolean;
  restoreInput: string;
  restoredOutput: string | null;
  restoreSegments: RestoredSegment[] | null;
  restoreReport: RestoreReport | null;
  dialog: DialogState;
  toast: ToastMessage | null;
}

const initialState: State = {
  step: 'prepare',
  rawText: '',
  documentLabel: null,
  sampleLoaded: false,
  isEditing: false,
  scanPhase: 'idle',
  scanError: null,
  modelStatus: 'unknown',
  modelProgress: null,
  detections: [],
  cast: [],
  safeCopy: null,
  unprotectedAck: false,
  copyAck: false,
  restoreInput: '',
  restoredOutput: null,
  restoreSegments: null,
  restoreReport: null,
  dialog: null,
  toast: null,
};

type Action =
  | { type: 'SET_TEXT'; text: string }
  | { type: 'LOAD_DOCUMENT'; text: string; label: string; sample: boolean }
  | { type: 'BEGIN_EDIT' }
  | { type: 'SCAN_START' }
  | { type: 'SCAN_PHASE'; phase: ScanPhase; progress?: number | null }
  | { type: 'MODEL_STATUS'; status: ModelStatus }
  | { type: 'SCAN_DONE'; detections: Detection[]; cast: CastEntry[] }
  | { type: 'SCAN_FALLBACK'; detections: Detection[]; cast: CastEntry[]; message: string }
  | { type: 'SCAN_FATAL'; message: string }
  | { type: 'SCAN_CANCELLED' }
  | { type: 'TOGGLE_CAST'; key: string }
  | { type: 'SET_ALL_CAST'; accepted: boolean }
  | { type: 'ADD_CUSTOM'; entry: CastEntry }
  | { type: 'SET_UNPROTECTED_ACK'; value: boolean }
  | { type: 'CREATE_SAFE'; snapshot: SafeSnapshot }
  | { type: 'SET_COPY_ACK'; value: boolean }
  | { type: 'GO_STEP'; step: Step }
  | { type: 'SET_RESTORE_INPUT'; text: string }
  | { type: 'RESTORE'; output: string; segments: RestoredSegment[]; report: RestoreReport }
  | { type: 'RESET_RESTORE' }
  | { type: 'SET_DIALOG'; dialog: DialogState }
  | { type: 'TOAST'; toast: ToastMessage }
  | { type: 'CLEAR_TOAST'; id: number }
  | { type: 'START_OVER' };

function withoutWorkspace(state: State): State {
  return {
    ...initialState,
    modelStatus: state.modelStatus === 'ready' ? 'ready' : state.modelStatus,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TEXT':
      return {
        ...state,
        rawText: action.text,
        documentLabel: null,
        sampleLoaded: false,
        isEditing: true,
        scanPhase: 'idle',
        scanError: null,
        modelProgress: null,
        detections: [],
        cast: [],
        safeCopy: null,
        unprotectedAck: false,
        copyAck: false,
        restoreInput: '',
        restoredOutput: null,
        restoreSegments: null,
        restoreReport: null,
        step: 'prepare',
        dialog: null,
      };
    case 'LOAD_DOCUMENT':
      return {
        ...withoutWorkspace(state),
        rawText: action.text,
        documentLabel: action.label,
        sampleLoaded: action.sample,
        isEditing: true,
        dialog: null,
      };
    case 'BEGIN_EDIT':
      return {
        ...state,
        isEditing: true,
        scanPhase: 'idle',
        scanError: null,
        modelProgress: null,
        detections: [],
        cast: [],
        safeCopy: null,
        unprotectedAck: false,
        copyAck: false,
        restoreInput: '',
        restoredOutput: null,
        restoreSegments: null,
        restoreReport: null,
        step: 'prepare',
        dialog: null,
      };
    case 'SCAN_START':
      return {
        ...state,
        step: 'prepare',
        isEditing: false,
        scanPhase: 'chunking',
        scanError: null,
        modelStatus: 'loading',
        modelProgress: null,
        detections: [],
        cast: [],
        unprotectedAck: false,
        copyAck: false,
        dialog: null,
      };
    case 'SCAN_PHASE':
      return {
        ...state,
        scanPhase: action.phase,
        modelProgress:
          typeof action.progress === 'number' ? action.progress : state.modelProgress,
      };
    case 'MODEL_STATUS':
      return { ...state, modelStatus: action.status };
    case 'SCAN_DONE':
      return {
        ...state,
        isEditing: false,
        scanPhase: 'done',
        scanError: null,
        modelStatus: 'ready',
        modelProgress: null,
        detections: action.detections,
        cast: action.cast,
      };
    case 'SCAN_FALLBACK':
      return {
        ...state,
        isEditing: false,
        scanPhase: 'done',
        scanError: action.message,
        modelStatus: 'fallback',
        modelProgress: null,
        detections: action.detections,
        cast: action.cast,
      };
    case 'SCAN_FATAL':
      return {
        ...state,
        isEditing: true,
        scanPhase: 'error',
        scanError: action.message,
        modelProgress: null,
        detections: [],
        cast: [],
      };
    case 'SCAN_CANCELLED':
      return {
        ...state,
        isEditing: true,
        scanPhase: 'idle',
        scanError: null,
        modelProgress: null,
        detections: [],
        cast: [],
        unprotectedAck: false,
        copyAck: false,
      };
    case 'TOGGLE_CAST':
      return {
        ...state,
        cast: state.cast.map((entry) =>
          entry.key === action.key ? { ...entry, accepted: !entry.accepted } : entry,
        ),
        copyAck: false,
      };
    case 'SET_ALL_CAST':
      return {
        ...state,
        cast: state.cast.map((entry) => ({ ...entry, accepted: action.accepted })),
        copyAck: false,
      };
    case 'ADD_CUSTOM':
      return {
        ...state,
        cast: [...state.cast, action.entry],
        copyAck: false,
      };
    case 'SET_UNPROTECTED_ACK':
      return { ...state, unprotectedAck: action.value };
    case 'CREATE_SAFE':
      return {
        ...state,
        safeCopy: action.snapshot,
        step: 'safe',
        copyAck: false,
        unprotectedAck: false,
      };
    case 'SET_COPY_ACK':
      return { ...state, copyAck: action.value };
    case 'GO_STEP':
      if (action.step === 'safe' && !state.safeCopy) return state;
      return { ...state, step: action.step, dialog: null };
    case 'SET_RESTORE_INPUT':
      return {
        ...state,
        restoreInput: action.text,
        restoredOutput: null,
        restoreSegments: null,
        restoreReport: null,
      };
    case 'RESTORE':
      return {
        ...state,
        restoredOutput: action.output,
        restoreSegments: action.segments,
        restoreReport: action.report,
      };
    case 'RESET_RESTORE':
      return {
        ...state,
        restoreInput: '',
        restoredOutput: null,
        restoreSegments: null,
        restoreReport: null,
      };
    case 'SET_DIALOG':
      return { ...state, dialog: action.dialog };
    case 'TOAST':
      return { ...state, toast: action.toast };
    case 'CLEAR_TOAST':
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    case 'START_OVER':
      return withoutWorkspace(state);
    default:
      return state;
  }
}

export function useStandIn(injectedDetector?: ModelDetector) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const workerDetector = useWorkerScanner();
  const detector = injectedDetector ?? workerDetector;

  const scanningRef = useRef(false);
  const scanRunRef = useRef(0);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((tone: ToastMessage['tone'], message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const toast = { id: toastIdRef.current + 1, tone, message };
    toastIdRef.current = toast.id;
    dispatch({ type: 'TOAST', toast });
    toastTimerRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_TOAST', id: toast.id });
    }, 4400);
  }, []);

  const dismissToast = useCallback((id: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    dispatch({ type: 'CLEAR_TOAST', id });
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const hasWork = state.rawText.trim() || state.safeCopy || state.restoreInput.trim();
    if (!hasWork) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.rawText, state.safeCopy, state.restoreInput]);

  const scan = useCallback(async () => {
    const text = state.rawText;
    if (!text.trim()) {
      notify('error', 'Paste a document before scanning.');
      return;
    }
    if (text.length > CHAR_LIMIT) {
      notify('error', 'This document is over 20,000 characters. Shorten it before scanning.');
      return;
    }
    if (scanningRef.current) return;

    scanningRef.current = true;
    const run = scanRunRef.current + 1;
    scanRunRef.current = run;
    dispatch({ type: 'SCAN_START' });

    let patterns: Detection[] = [];

    try {
      dispatch({ type: 'SCAN_PHASE', phase: 'chunking' });
      const chunks = chunkText(text);

      dispatch({ type: 'SCAN_PHASE', phase: 'patterns' });
      patterns = findPatternDetections(text);
      if (scanRunRef.current !== run) return;

      dispatch({ type: 'SCAN_PHASE', phase: 'model-loading', progress: null });
      const modelEntities = await detector(chunks, (event) => {
        if (scanRunRef.current !== run) return;
        if (event.phase === 'loading') {
          dispatch({ type: 'SCAN_PHASE', phase: 'model-loading', progress: event.progress ?? 0 });
          return;
        }
        if (event.phase === 'ready') {
          dispatch({ type: 'MODEL_STATUS', status: 'ready' });
          dispatch({ type: 'SCAN_PHASE', phase: 'model-scanning', progress: 0 });
          return;
        }
        dispatch({ type: 'MODEL_STATUS', status: 'ready' });
        dispatch({ type: 'SCAN_PHASE', phase: 'model-scanning', progress: event.progress ?? 0 });
      });

      if (scanRunRef.current !== run) return;

      dispatch({ type: 'SCAN_PHASE', phase: 'merging' });
      const merged = mergeDetections(text, patterns, modelEntities);
      const cast = buildCast(merged, text);
      dispatch({ type: 'SCAN_DONE', detections: merged, cast });
    } catch {
      if (scanRunRef.current !== run) return;
      const cast = buildCast(patterns, text);
      dispatch({
        type: 'SCAN_FALLBACK',
        detections: patterns,
        cast,
        message:
          'The private detector could not run, so names, organizations, and locations were not checked. Pattern checks still ran. Review manually before sharing.',
      });
    } finally {
      if (scanRunRef.current === run) scanningRef.current = false;
    }
  }, [detector, notify, state.rawText]);

  const cancelScan = useCallback(() => {
    if (!scanningRef.current) return;
    scanRunRef.current += 1;
    scanningRef.current = false;
    dispatch({ type: 'SCAN_CANCELLED' });
  }, []);

  const setText = useCallback((text: string) => {
    dispatch({ type: 'SET_TEXT', text });
  }, []);

  const hasWork = Boolean(
    state.rawText.trim() || state.safeCopy || state.restoreInput.trim(),
  );

  const requestDocument = useCallback(
    (text: string, label: string, sample: boolean) => {
      if (text.length > CHAR_LIMIT) {
        notify('error', `That document is ${text.length.toLocaleString('en-US')} characters. The limit is 20,000.`);
        return;
      }
      if (hasWork) {
        dispatch({
          type: 'SET_DIALOG',
          dialog: sample
            ? { kind: 'replace-sample' }
            : { kind: 'replace-text', text, label },
        });
        return;
      }
      dispatch({ type: 'LOAD_DOCUMENT', text, label, sample });
    },
    [hasWork, notify],
  );

  const loadSample = useCallback(() => {
    requestDocument(SAMPLE_TEXT, 'Sample memo', true);
  }, [requestDocument]);

  const loadFile = useCallback(
    (text: string, label: string) => {
      requestDocument(text, label, false);
    },
    [requestDocument],
  );

  const requestEdit = useCallback(() => {
    if (state.scanPhase === 'done' || state.cast.length > 0) {
      dispatch({ type: 'SET_DIALOG', dialog: { kind: 'edit' } });
      return;
    }
    dispatch({ type: 'BEGIN_EDIT' });
  }, [state.cast.length, state.scanPhase]);

  const requestStartOver = useCallback(() => {
    if (!hasWork) return;
    dispatch({ type: 'SET_DIALOG', dialog: { kind: 'reset' } });
  }, [hasWork]);

  const confirmDialog = useCallback(() => {
    const dialog = state.dialog;
    dispatch({ type: 'SET_DIALOG', dialog: null });
    if (!dialog) return;

    if (dialog.kind === 'edit') {
      dispatch({ type: 'BEGIN_EDIT' });
      return;
    }

    if (dialog.kind === 'reset') {
      scanRunRef.current += 1;
      scanningRef.current = false;
      dispatch({ type: 'START_OVER' });
      notify('success', 'Workspace cleared. Nothing was saved.');
      return;
    }

    if (dialog.kind === 'replace-sample') {
      scanRunRef.current += 1;
      scanningRef.current = false;
      dispatch({ type: 'LOAD_DOCUMENT', text: SAMPLE_TEXT, label: 'Sample memo', sample: true });
      notify('success', 'Sample memo loaded.');
      return;
    }

    scanRunRef.current += 1;
    scanningRef.current = false;
    dispatch({ type: 'LOAD_DOCUMENT', text: dialog.text, label: dialog.label, sample: false });
    notify('success', 'Document loaded.');
  }, [notify, state.dialog]);

  const cancelDialog = useCallback(() => {
    dispatch({ type: 'SET_DIALOG', dialog: null });
  }, []);

  const toggleCast = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_CAST', key });
  }, []);

  const setAllCast = useCallback((accepted: boolean) => {
    dispatch({ type: 'SET_ALL_CAST', accepted });
  }, []);

  const addCustomTerm = useCallback(
    (term: string): string | null => {
      const result = addCustomCastEntry(state.cast, state.rawText, term);
      if (result.error || !result.entry) return result.error ?? 'That term could not be added.';
      dispatch({ type: 'ADD_CUSTOM', entry: result.entry });
      return null;
    },
    [state.cast, state.rawText],
  );

  const setUnprotectedAck = useCallback((value: boolean) => {
    dispatch({ type: 'SET_UNPROTECTED_ACK', value });
  }, []);

  const createSafeCopy = useCallback((): boolean => {
    if (!state.rawText.trim()) return false;
    const accepted = acceptedEntries(state.cast);
    if (accepted.length === 0 && !state.unprotectedAck) {
      notify('error', 'Acknowledge that no automatic protection will be applied first.');
      return false;
    }

    const tokenized = tokenizeDocument(state.rawText, state.cast);
    const snapshotCast = cloneCast(accepted);
    const snapshot: SafeSnapshot = {
      text: tokenized.text,
      cast: snapshotCast,
      leaks: checkLeaks(tokenized.text, snapshotCast),
      checkedAt: Date.now(),
      unprotected: accepted.length === 0,
      replacedMentions: tokenized.replacedMentions,
    };

    dispatch({ type: 'CREATE_SAFE', snapshot });
    return true;
  }, [notify, state.cast, state.rawText, state.unprotectedAck]);

  const setCopyAck = useCallback((value: boolean) => {
    dispatch({ type: 'SET_COPY_ACK', value });
  }, []);

  const goStep = useCallback((step: Step) => {
    dispatch({ type: 'GO_STEP', step });
  }, []);

  const setRestoreInput = useCallback((text: string) => {
    dispatch({ type: 'SET_RESTORE_INPUT', text });
  }, []);

  const restore = useCallback(() => {
    if (!state.safeCopy || !state.restoreInput.trim()) return;
    const result = restoreTokens(state.restoreInput, state.safeCopy.cast);
    dispatch({
      type: 'RESTORE',
      output: result.output,
      segments: result.segments,
      report: result.report,
    });
  }, [state.restoreInput, state.safeCopy]);

  const resetRestore = useCallback(() => {
    dispatch({ type: 'RESET_RESTORE' });
  }, []);

  const copyText = useCallback(
    async (text: string, elementId: string, successMessage: string) => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        notify('success', successMessage);
      } catch {
        const element = document.getElementById(elementId);
        if (element) {
          const range = document.createRange();
          range.selectNodeContents(element);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          notify('error', 'The clipboard is blocked. The text is selected—press ⌘C or Ctrl+C to copy.');
        } else {
          notify('error', 'The clipboard is blocked. Select the text and copy it manually.');
        }
      }
    },
    [notify],
  );

  const copySafeCopy = useCallback(() => {
    if (!state.safeCopy) return;
    const stale = !sameAcceptedCast(state.cast, state.safeCopy.cast);
    if (stale) {
      notify('error', 'Update the safe copy before copying it.');
      return;
    }
    if (state.safeCopy.leaks.length > 0 && !state.copyAck) {
      notify('error', 'Review the leaks and acknowledge them before copying.');
      return;
    }
    void copyText(state.safeCopy.text, 'safe-copy-text', 'Safe copy copied.');
  }, [copyText, notify, state.cast, state.copyAck, state.safeCopy]);

  const downloadSafeCopy = useCallback(() => {
    if (!state.safeCopy) return;
    if (!sameAcceptedCast(state.cast, state.safeCopy.cast)) {
      notify('error', 'Update the safe copy before downloading it.');
      return;
    }
    if (state.safeCopy.leaks.length > 0 && !state.copyAck) {
      notify('error', 'Review the leaks and acknowledge them before downloading.');
      return;
    }
    try {
      const blob = new Blob([state.safeCopy.text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'standin-safe-copy.txt';
      link.click();
      URL.revokeObjectURL(url);
      notify('success', 'Safe copy downloaded.');
    } catch {
      notify('error', 'The download could not start. Copy the text instead.');
    }
  }, [notify, state.cast, state.copyAck, state.safeCopy]);

  const copyRestored = useCallback(() => {
    if (!state.restoredOutput) return;
    void copyText(state.restoredOutput, 'restored-output', 'Restored answer copied.');
  }, [copyText, state.restoredOutput]);

  const safeStale = state.safeCopy
    ? !sameAcceptedCast(state.cast, state.safeCopy.cast)
    : false;

  const summary = useMemo(() => {
    const accepted = state.cast.filter((entry) => entry.accepted);
    const acceptedMentions = accepted.reduce((total, entry) => total + entry.mentions.length, 0);
    const allMentions = state.cast.reduce((total, entry) => total + entry.mentions.length, 0);
    const plannedReplacements = tokenizeDocument(state.rawText, state.cast).replacedMentions;
    return {
      totalEntries: state.cast.length,
      acceptedEntries: accepted.length,
      acceptedMentions,
      allMentions,
      plannedReplacements,
    };
  }, [state.cast, state.rawText]);

  return {
    ...state,
    ...summary,
    safeStale,
    scanning: state.scanPhase !== 'idle' && state.scanPhase !== 'done' && state.scanPhase !== 'error',
    scan,
    cancelScan,
    setText,
    loadSample,
    loadFile,
    requestEdit,
    requestStartOver,
    confirmDialog,
    cancelDialog,
    toggleCast,
    setAllCast,
    addCustomTerm,
    setUnprotectedAck,
    createSafeCopy,
    setCopyAck,
    goStep,
    setRestoreInput,
    restore,
    resetRestore,
    copySafeCopy,
    downloadSafeCopy,
    copyRestored,
    notify,
    dismissToast,
  };
}

export type StandInController = ReturnType<typeof useStandIn>;
