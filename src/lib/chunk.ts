import type { ScanChunk } from './types';

const TARGET_CHARS = 900;
const MIN_CHARS = 300;
const OVERLAP = 80;

export function chunkText(text: string): ScanChunk[] {
  if (!text) return [];
  if (text.length <= TARGET_CHARS) return [{ text, start: 0 }];

  const chunks: ScanChunk[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(cursor + TARGET_CHARS, text.length);

    if (end < text.length) {
      const searchFrom = cursor + MIN_CHARS;
      const boundary = findBoundary(text, searchFrom, end);
      if (boundary > cursor) end = boundary;
      if (end <= cursor) end = Math.min(cursor + TARGET_CHARS, text.length);
    }

    chunks.push({ text: text.slice(cursor, end), start: cursor });

    if (end >= text.length) break;

    const next = Math.max(end - OVERLAP, cursor + 1);
    cursor = next;
  }

  return chunks;
}

function findBoundary(text: string, from: number, before: number): number {
  for (let i = before; i > from; i -= 1) {
    const current = text[i - 1];
    const next = text[i];

    if (current === '\n' && next !== '\n') return i;
    if (/[.!?]/.test(current) && /\s/.test(next ?? '')) return i;
  }
  return -1;
}
