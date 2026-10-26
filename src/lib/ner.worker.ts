import { env, pipeline } from '@huggingface/transformers';
import type {
  EntityType,
  ModelEntity,
  NerWorkerRequest,
  NerWorkerResponse,
  ScanChunk,
} from './types';

interface RawToken {
  entity: string;
  score: number;
  index: number;
  word: string;
}

type NerFunction = (
  text: string,
  options: { ignore_labels: string[] },
) => Promise<RawToken[]>;

type ProgressInfo = {
  status: string;
  progress?: number;
  file?: string;
};

const scope = self as unknown as {
  postMessage: (message: NerWorkerResponse) => void;
  onmessage: ((event: MessageEvent<NerWorkerRequest>) => void) | null;
};

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/ort/';
  env.backends.onnx.wasm.numThreads = 1;
}

let nerPromise: Promise<NerFunction> | null = null;
let activeRequest = 0;

function postStatus(
  requestId: number,
  phase: 'loading' | 'ready' | 'scanning',
  progress?: number,
) {
  scope.postMessage({ type: 'status', requestId, phase, progress });
}

async function getNer(requestId: number): Promise<NerFunction> {
  if (!nerPromise) {
    postStatus(requestId, 'loading', 0);
    nerPromise = (async () => {
      const instance = await pipeline('token-classification', 'onnx-community/distilbert-NER-ONNX', {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (info: ProgressInfo) => {
          if (
            activeRequest === requestId &&
            (info.status === 'progress' || info.status === 'progress_total') &&
            typeof info.progress === 'number'
          ) {
            postStatus(requestId, 'loading', Math.round(info.progress));
          }
        },
      });
      postStatus(requestId, 'ready');
      return instance as unknown as NerFunction;
    })().catch((error: unknown) => {
      nerPromise = null;
      throw error;
    });
  }
  return nerPromise;
}

scope.onmessage = (event: MessageEvent<NerWorkerRequest>) => {
  if (event.data?.type !== 'scan') return;
  const request = event.data;
  activeRequest = request.requestId;
  void runScan(request);
};

async function runScan(request: NerWorkerRequest) {
  try {
    const ner = await getNer(request.requestId);
    const entities: ModelEntity[] = [];

    for (let index = 0; index < request.chunks.length; index += 1) {
      if (activeRequest !== request.requestId) return;
      postStatus(
        request.requestId,
        'scanning',
        Math.round((index / request.chunks.length) * 100),
      );
      const tokens = await ner(request.chunks[index].text, { ignore_labels: [] });
      entities.push(...extractEntities(request.chunks[index], tokens));
    }

    if (activeRequest !== request.requestId) return;
    scope.postMessage({ type: 'result', requestId: request.requestId, entities });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message.slice(0, 300)
        : 'The local detector could not start.';
    scope.postMessage({ type: 'error', requestId: request.requestId, message });
  }
}

function extractEntities(chunk: ScanChunk, tokens: RawToken[]): ModelEntity[] {
  const aligned = alignTokens(chunk.text, tokens);
  const finalEnd = new Map<number, number>();

  for (const token of aligned) {
    if (token.wordStart === null || token.wordEnd === null) continue;
    finalEnd.set(token.wordStart, Math.max(finalEnd.get(token.wordStart) ?? 0, token.wordEnd));
  }

  const groups: { tag: string; tokens: AlignedToken[] }[] = [];
  let open: { tag: string; tokens: AlignedToken[] } | null = null;

  for (const token of aligned) {
    const label = token.entity;
    if (!label || label === 'O' || label.length < 2) {
      open = null;
      continue;
    }

    const prefix = label[0];
    const tag = label.slice(2);
    if (prefix === 'B' || prefix === 'S' || !open || open.tag !== tag) {
      open = { tag, tokens: [token] };
      groups.push(open);
    } else {
      open.tokens.push(token);
    }
    if (prefix === 'S' || prefix === 'E') open = null;
  }

  const entities: ModelEntity[] = [];
  for (const group of groups) {
    const type = mapType(group.tag);
    if (!type) continue;

    const tokens = group.tokens.filter(
      (token) => token.wordStart !== null && token.wordEnd !== null,
    );
    if (tokens.length === 0) continue;

    let start = Math.min(...tokens.map((token) => token.wordStart as number));
    const last = tokens[tokens.length - 1];
    let end = finalEnd.get(last.wordStart as number) ?? (last.wordEnd as number);
    if (end <= start) continue;

    const source = chunk.text.slice(start, end);
    const leading = source.length - source.trimStart().length;
    const trailing = source.length - source.trimEnd().length;
    start += leading;
    end -= trailing;
    if (end - start < 2) continue;

    const confidence =
      tokens.reduce((sum, token) => sum + token.score, 0) / Math.max(1, tokens.length);

    entities.push({
      start: chunk.start + start,
      end: chunk.start + end,
      text: chunk.text.slice(start, end),
      type,
      confidence,
    });
  }

  return entities;
}

interface AlignedToken extends RawToken {
  wordStart: number | null;
  wordEnd: number | null;
}

function alignTokens(text: string, tokens: RawToken[]): AlignedToken[] {
  const haystack = text.toLowerCase();
  let cursor = 0;
  let wordStart: number | null = null;
  let wordEnd: number | null = null;

  return tokens.map((token) => {
    if (!token.word || /^\[.*\]$/.test(token.word)) {
      return { ...token, wordStart: null, wordEnd: null };
    }

    const continuation = token.word.startsWith('##');
    const piece = token.word.replace(/^##/, '').toLowerCase();
    if (!piece) return { ...token, wordStart: null, wordEnd: null };

    const index = haystack.indexOf(piece, cursor);
    if (index < 0) {
      return { ...token, wordStart, wordEnd };
    }

    if (!continuation) wordStart = index;
    if (wordStart === null) wordStart = index;
    wordEnd = index + piece.length;
    cursor = wordEnd;

    return { ...token, wordStart, wordEnd };
  });
}

function mapType(tag: string): EntityType | null {
  switch (tag) {
    case 'PER':
      return 'PERSON';
    case 'ORG':
      return 'ORG';
    case 'LOC':
      return 'LOCATION';
    case 'MISC':
      return 'MISC';
    default:
      return null;
  }
}
