import { findOccurrences } from './tokenize';
import {
  compareTypes,
  normalizeEntityText,
  type CastEntry,
  type Detection,
  type DetectionSource,
  type EntityType,
} from './types';

const SOURCE_RANK: Record<DetectionSource, number> = {
  custom: 3,
  pattern: 2,
  model: 1,
};

type DraftCastEntry = CastEntry & { firstStart: number };

export function buildCast(detections: Detection[], sourceText?: string): CastEntry[] {
  const groups = new Map<string, Detection[]>();

  for (const detection of [...detections].sort((a, b) => a.start - b.start || b.end - a.end)) {
    const key = normalizeEntityText(detection.text);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(detection);
    else groups.set(key, [detection]);
  }

  const entries: DraftCastEntry[] = [...groups.entries()].map(([key, mentions]) => {
    const sorted = [...mentions].sort((a, b) => a.start - b.start);
    const best = [...sorted].sort(
      (a, b) =>
        SOURCE_RANK[b.source] - SOURCE_RANK[a.source] ||
        b.confidence - a.confidence ||
        compareTypes(a.type, b.type),
    )[0];

    return {
      key,
      display: sorted[0].text,
      type: best.type,
      token: '',
      accepted: true,
      source: best.source,
      confidence: best.confidence,
      mentions: sorted,
      firstStart: sorted[0].start,
    };
  });

  if (sourceText) absorbPartialNameMentions(entries, sourceText);

  const populated = entries.filter((entry) => entry.mentions.length > 0);
  populated.sort((a, b) => a.firstStart - b.firstStart || compareTypes(a.type, b.type));

  const counters = new Map<EntityType, number>();
  return populated.map(({ firstStart: _firstStart, ...entry }) => {
    const next = (counters.get(entry.type) ?? 0) + 1;
    counters.set(entry.type, next);
    return { ...entry, token: `[${entry.type}_${next}]` };
  });
}

function absorbPartialNameMentions(entries: DraftCastEntry[], sourceText: string) {
  const absorbed = new Map<DraftCastEntry, Detection[]>();
  const ordered = [...entries].sort((a, b) => a.key.length - b.key.length);

  for (const entry of ordered) {
    if (entry.key.length < 3) continue;
    const targets = entries.filter(
      (candidate) =>
        candidate !== entry &&
        candidate.type === entry.type &&
        isWholeWordAffix(entry.key, candidate.key),
    );
    if (targets.length === 0) continue;

    const remaining: Detection[] = [];
    for (const mention of entry.mentions) {
      let hit: { target: DraftCastEntry; start: number; end: number } | null = null;
      for (const target of targets) {
        const occurrence = findOccurrences(sourceText, target.display).find(
          (span) =>
            span.start <= mention.start &&
            span.end >= mention.end &&
            (span.start < mention.start || span.end > mention.end),
        );
        if (occurrence) {
          hit = { target, start: occurrence.start, end: occurrence.end };
          break;
        }
      }

      if (!hit) {
        remaining.push(mention);
        continue;
      }

      const expanded: Detection = {
        ...mention,
        start: hit.start,
        end: hit.end,
        text: sourceText.slice(hit.start, hit.end),
        type: hit.target.type,
      };
      const list = absorbed.get(hit.target) ?? [];
      if (!list.some((item) => item.start === expanded.start && item.end === expanded.end)) {
        list.push(expanded);
      }
      absorbed.set(hit.target, list);
    }
    entry.mentions = remaining;
    if (remaining.length > 0) entry.firstStart = remaining[0].start;
  }

  for (const [target, extra] of absorbed) {
    for (const detection of extra) {
      if (
        !target.mentions.some(
          (mention) => mention.start === detection.start && mention.end === detection.end,
        )
      ) {
        target.mentions.push(detection);
      }
    }
    target.mentions.sort((a, b) => a.start - b.start);
    target.firstStart = target.mentions[0].start;

    const best = [...target.mentions].sort(
      (a, b) =>
        SOURCE_RANK[b.source] - SOURCE_RANK[a.source] ||
        b.confidence - a.confidence ||
        compareTypes(a.type, b.type),
    )[0];
    if (best) {
      target.source = best.source;
      target.confidence = best.confidence;
    }
  }
}

function isWholeWordAffix(shortKey: string, longKey: string): boolean {
  if (shortKey === longKey || shortKey.length < 3) return false;
  if (longKey.startsWith(shortKey)) {
    const next = longKey[shortKey.length] ?? '';
    if (!/[a-z0-9]/.test(next)) return true;
  }
  if (longKey.endsWith(shortKey)) {
    const before = longKey[longKey.length - shortKey.length - 1] ?? '';
    if (!/[a-z0-9]/.test(before)) return true;
  }
  return false;
}

export interface CustomEntryResult {
  entry?: CastEntry;
  error?: string;
}

export function addCustomCastEntry(
  cast: CastEntry[],
  rawText: string,
  rawTerm: string,
): CustomEntryResult {
  const term = rawTerm.trim().replace(/\s+/g, ' ');
  if (!term) return { error: 'Enter a term to add to the cast.' };
  if (term.length < 2) return { error: 'Use at least two characters for a custom term.' };

  const key = normalizeEntityText(term);
  if (cast.some((entry) => entry.key === key)) {
    return { error: `“${term}” is already in the cast.` };
  }

  const spans = findOccurrences(rawText, term);
  if (spans.length === 0) {
    return { error: `Nothing in this document matches “${term}”. Check the spelling and try again.` };
  }

  const nextNumber =
    cast.reduce((highest, entry) => {
      const match = /^\[CUSTOM_(\d+)\]$/.exec(entry.token);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;

  const mentions: Detection[] = spans.map((span, index) => ({
    id: `custom:${span.start}:${span.end}:${index}`,
    start: span.start,
    end: span.end,
    text: rawText.slice(span.start, span.end),
    type: 'CUSTOM',
    source: 'custom',
    confidence: 1,
  }));

  return {
    entry: {
      key,
      display: mentions[0].text,
      type: 'CUSTOM',
      token: `[CUSTOM_${nextNumber}]`,
      accepted: true,
      source: 'custom',
      confidence: 1,
      mentions,
    },
  };
}

export function acceptedEntries(cast: CastEntry[]): CastEntry[] {
  return cast.filter((entry) => entry.accepted);
}

export function sameAcceptedCast(a: CastEntry[], b: CastEntry[]): boolean {
  const signature = (cast: CastEntry[]) =>
    cast
      .filter((entry) => entry.accepted)
      .map((entry) => `${entry.token}|${entry.type}|${entry.display}`)
      .sort()
      .join('::');
  return signature(a) === signature(b);
}

export function countMentions(cast: CastEntry[]): number {
  return cast.reduce((total, entry) => total + (entry.accepted ? entry.mentions.length : 0), 0);
}

export function cloneCast(cast: CastEntry[]): CastEntry[] {
  return cast.map((entry) => ({
    ...entry,
    mentions: entry.mentions.map((mention) => ({ ...mention })),
  }));
}
