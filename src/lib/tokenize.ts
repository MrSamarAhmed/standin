import type { CastEntry } from './types';

export interface Occurrence {
  start: number;
  end: number;
}

const WORD_CHARACTER = /[A-Za-z0-9]/;

export function findOccurrences(text: string, value: string): Occurrence[] {
  const needle = value.trim();
  if (!needle) return [];

  const haystack = text.toLowerCase();
  const foldedNeedle = needle.toLowerCase();
  const occurrences: Occurrence[] = [];
  let searchFrom = 0;

  while (searchFrom <= haystack.length - foldedNeedle.length) {
    const start = haystack.indexOf(foldedNeedle, searchFrom);
    if (start < 0) break;

    const candidate = text.slice(start, start + needle.length);
    if (candidate.toLowerCase() !== foldedNeedle) {
      searchFrom = start + 1;
      continue;
    }

    const end = start + needle.length;
    const leftOpen =
      !WORD_CHARACTER.test(needle[0]) || !WORD_CHARACTER.test(text[start - 1] ?? '');
    const rightOpen =
      !WORD_CHARACTER.test(needle[needle.length - 1]) ||
      !WORD_CHARACTER.test(text[end] ?? '');

    if (leftOpen && rightOpen) occurrences.push({ start, end });
    searchFrom = start + Math.max(1, needle.length);
  }

  return occurrences;
}

interface Replacement extends Occurrence {
  entry: CastEntry;
}

export interface TokenizeResult {
  text: string;
  replacedMentions: number;
}

export function tokenizeDocument(source: string, cast: CastEntry[]): TokenizeResult {
  const candidates: Replacement[] = [];

  for (const entry of cast) {
    if (!entry.accepted) continue;
    for (const occurrence of findOccurrences(source, entry.display)) {
      candidates.push({ ...occurrence, entry });
    }
  }

  candidates.sort((a, b) => a.start - b.start || b.end - a.end);

  const selected: Replacement[] = [];
  let coveredUntil = -1;
  for (const candidate of candidates) {
    if (candidate.start < coveredUntil) continue;
    selected.push(candidate);
    coveredUntil = candidate.end;
  }

  if (selected.length === 0) {
    return { text: source, replacedMentions: 0 };
  }

  let output = '';
  let cursor = 0;
  for (const replacement of selected) {
    output += source.slice(cursor, replacement.start);
    output += replacement.entry.token;
    cursor = replacement.end;
  }
  output += source.slice(cursor);

  return { text: output, replacedMentions: selected.length };
}
