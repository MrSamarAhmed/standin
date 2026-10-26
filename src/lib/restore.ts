import type { CastEntry, RestoreReport, RestoredSegment } from './types';

const LOOSE_TOKEN = /\[\s*([A-Za-z]+)\s*[_-]?\s*(\d+)\s*\]/g;
const STRICT_TOKEN = /\[[A-Z]+_\d+\]/g;

export function normalizeToken(type: string, number: string | number): string {
  return `[${type.toUpperCase()}_${Number(number)}]`;
}

export interface RestoreResult {
  output: string;
  segments: RestoredSegment[];
  report: RestoreReport;
}

export function restoreTokens(input: string, cast: CastEntry[]): RestoreResult {
  const byToken = new Map<string, CastEntry>();
  for (const entry of cast) {
    if (entry.accepted) byToken.set(entry.token, entry);
  }

  const segments: RestoredSegment[] = [];
  const unknown: string[] = [];
  let restored = 0;
  let totalTokens = 0;
  let cursor = 0;

  for (const match of input.matchAll(LOOSE_TOKEN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: 'plain', text: input.slice(cursor, start) });
    }

    totalTokens += 1;
    const entry = byToken.get(normalizeToken(match[1], match[2]));
    if (entry) {
      restored += 1;
      segments.push({
        kind: 'restored',
        text: entry.display,
        type: entry.type,
        token: entry.token,
      });
    } else {
      unknown.push(match[0]);
      segments.push({ kind: 'unknown', text: match[0], token: match[0] });
    }

    cursor = start + match[0].length;
  }

  if (cursor < input.length) {
    segments.push({ kind: 'plain', text: input.slice(cursor) });
  }

  if (segments.length === 0) {
    segments.push({ kind: 'plain', text: input });
  }

  return {
    output: segments.map((segment) => segment.text).join(''),
    segments,
    report: { restored, unknown, totalTokens },
  };
}

export interface TextTokenSegment {
  kind: 'text' | 'token';
  text: string;
}

export function splitTokenSegments(text: string): TextTokenSegment[] {
  const segments: TextTokenSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(STRICT_TOKEN)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, start) });
    segments.push({ kind: 'token', text: match[0] });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  if (segments.length === 0) segments.push({ kind: 'text', text });
  return segments;
}
