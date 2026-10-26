import { findPatternDetections } from './patterns';
import { findOccurrences } from './tokenize';
import { TYPE_LABELS, type CastEntry, type Leak } from './types';

const LOOSE_TOKEN = /\[\s*([A-Za-z]+)\s*[_-]?\s*(\d+)\s*\]/g;

export function checkLeaks(safeText: string, cast: CastEntry[]): Leak[] {
  const accepted = cast.filter((entry) => entry.accepted);
  const leaks: Leak[] = [];
  const patternTexts = new Set<string>();

  for (const detection of findPatternDetections(safeText)) {
    patternTexts.add(detection.text.toLowerCase());
    leaks.push({
      kind: 'pattern',
      text: detection.text,
      type: detection.type,
      message: `${TYPE_LABELS[detection.type]} still visible: “${short(detection.text)}”.`,
    });
  }

  for (const entry of accepted) {
    for (const occurrence of findOccurrences(safeText, entry.display)) {
      const value = safeText.slice(occurrence.start, occurrence.end);
      if (patternTexts.has(value.toLowerCase())) continue;
      leaks.push({
        kind: 'original',
        text: value,
        type: entry.type,
        message: `The original ${TYPE_LABELS[entry.type].toLowerCase()} “${short(value)}” is still present.`,
      });
    }
  }

  const knownTokens = new Set(accepted.map((entry) => entry.token));
  for (const match of safeText.matchAll(LOOSE_TOKEN)) {
    const normalized = `[${match[1].toUpperCase()}_${Number(match[2])}]`;
    if (!knownTokens.has(normalized)) {
      leaks.push({
        kind: 'orphanToken',
        text: match[0],
        message: `Token ${match[0]} is not in this copy's cast. It will not restore to anything.`,
      });
    } else if (match[0] !== normalized) {
      leaks.push({
        kind: 'orphanToken',
        text: match[0],
        message: `Token ${match[0]} is malformed. Use the exact form ${normalized}.`,
      });
    }
  }

  return leaks;
}

function short(value: string): string {
  return value.length > 48 ? `${value.slice(0, 45)}…` : value;
}
