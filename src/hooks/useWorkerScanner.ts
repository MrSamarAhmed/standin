import { useCallback, useEffect, useRef } from 'react';
import type {
  ModelDetector,
  ModelEntity,
  NerWorkerRequest,
  NerWorkerResponse,
  ScanEvent,
} from '../lib/types';

interface PendingScan {
  requestId: number;
  onEvent?: (event: ScanEvent) => void;
  resolve: (entities: ModelEntity[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export function useWorkerScanner(): ModelDetector {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<PendingScan | null>(null);
  const requestCounter = useRef(0);

  const settle = useCallback((error?: Error, entities?: ModelEntity[]) => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    if (error) pending.reject(error);
    else pending.resolve(entities ?? []);
  }, []);

  const discardWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current.reject(new Error('The detector was stopped.'));
        pendingRef.current = null;
      }
      discardWorker();
    };
  }, [discardWorker]);

  const createWorker = useCallback(() => {
    const worker = new Worker(new URL('../lib/ner.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<NerWorkerResponse>) => {
      const pending = pendingRef.current;
      if (!pending || event.data.requestId !== pending.requestId) return;

      if (event.data.type === 'status') {
        pending.onEvent?.({
          phase: event.data.phase,
          progress: event.data.progress,
        });
        return;
      }

      if (event.data.type === 'result') {
        settle(undefined, event.data.entities);
        return;
      }

      discardWorker();
      settle(new Error(event.data.message));
    };

    worker.onerror = (event) => {
      const message = event.message || 'The detector worker stopped unexpectedly.';
      discardWorker();
      settle(new Error(message));
    };

    worker.onmessageerror = () => {
      discardWorker();
      settle(new Error('The detector returned an unreadable result.'));
    };

    return worker;
  }, [discardWorker, settle]);

  return useCallback(
    (chunks, onEvent) => {
      if (chunks.length === 0) return Promise.resolve([]);

      const previous = pendingRef.current;
      if (previous) {
        clearTimeout(previous.timer);
        pendingRef.current = null;
        previous.reject(new Error('The previous scan was interrupted.'));
        discardWorker();
      }

      if (!workerRef.current) workerRef.current = createWorker();
      const worker = workerRef.current;

      const requestId = requestCounter.current + 1;
      requestCounter.current = requestId;

      return new Promise<ModelEntity[]>((resolve, reject) => {
        const timer = setTimeout(() => {
          discardWorker();
          settle(new Error('The private detector took too long to respond.'));
        }, 120_000);

        pendingRef.current = { requestId, onEvent, resolve, reject, timer };

        const request: NerWorkerRequest = { type: 'scan', requestId, chunks };
        worker.postMessage(request);
      });
    },
    [createWorker, discardWorker, settle],
  );
}
