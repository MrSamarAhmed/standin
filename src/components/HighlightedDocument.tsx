import { useMemo, type ReactNode } from 'react';
import type { CastEntry, DetectionSource, EntityType } from '../lib/types';
import { TYPE_LABELS } from '../lib/types';

interface MentionSpan {
  start: number;
  end: number;
  entryKey: string;
  type: EntityType;
  accepted: boolean;
  token: string;
  display: string;
  source: DetectionSource;
}

const SOURCE_RANK: Record<DetectionSource, number> = {
  custom: 3,
  pattern: 2,
  model: 1,
};

function collectSpans(cast: CastEntry[], textLength: number): MentionSpan[] {
  const candidates: MentionSpan[] = [];

  for (const entry of cast) {
    for (const mention of entry.mentions) {
      const start = Math.max(0, Math.min(mention.start, textLength));
      const end = Math.max(start, Math.min(mention.end, textLength));
      if (end <= start) continue;
      candidates.push({
        start,
        end,
        entryKey: entry.key,
        type: entry.type,
        accepted: entry.accepted,
        token: entry.token,
        display: entry.display,
        source: entry.source,
      });
    }
  }

  candidates.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - b.start - (a.end - a.start) ||
      SOURCE_RANK[b.source] - SOURCE_RANK[a.source] ||
      Number(b.accepted) - Number(a.accepted),
  );

  const selected: MentionSpan[] = [];
  let coveredUntil = -1;
  for (const candidate of candidates) {
    if (candidate.start < coveredUntil) continue;
    selected.push(candidate);
    coveredUntil = candidate.end;
  }
  return selected;
}

export function HighlightedDocument({
  rawText,
  cast,
  onToggle,
}: {
  rawText: string;
  cast: CastEntry[];
  onToggle: (key: string) => void;
}) {
  const nodes = useMemo(() => {
    const spans = collectSpans(cast, rawText.length);
    const content: ReactNode[] = [];
    let cursor = 0;

    spans.forEach((span, index) => {
      if (span.start > cursor) {
        content.push(
          <span key={`plain-${cursor}-${index}`}>{rawText.slice(cursor, span.start)}</span>,
        );
      }

      content.push(
        <button
          key={`mention-${span.entryKey}-${span.start}-${span.end}`}
          type="button"
          className={`mention mention-${span.type.toLowerCase()} ${
            span.accepted ? 'is-cast' : 'is-kept'
          }`}
          aria-pressed={span.accepted}
          aria-label={`${rawText.slice(span.start, span.end)} — ${TYPE_LABELS[span.type]}, stand-in ${
            span.token
          }. ${span.accepted ? 'Selected to be replaced. Click to keep it as written.' : 'Kept as written. Click to replace it.'}`}
          title={`${TYPE_LABELS[span.type]} · ${span.token} · ${
            span.accepted ? 'will be replaced' : 'kept as written'
          }`}
          onClick={() => onToggle(span.entryKey)}
        >
          {rawText.slice(span.start, span.end)}
        </button>,
      );

      cursor = span.end;
    });

    if (cursor < rawText.length) {
      content.push(<span key={`plain-${cursor}-end`}>{rawText.slice(cursor)}</span>);
    }

    return content;
  }, [cast, onToggle, rawText]);

  return (
    <div className="document-text highlighted-document" aria-label="Highlighted document">
      {nodes}
    </div>
  );
}

export function HighlightLegend() {
  return (
    <div className="highlight-legend" aria-label="Highlight legend">
      <span>
        <i className="legend-swatch is-cast" aria-hidden="true" />
        Replaced with a stand-in
      </span>
      <span>
        <i className="legend-swatch is-kept" aria-hidden="true" />
        Kept as written
      </span>
      <span className="legend-note">Click any highlight to toggle it.</span>
    </div>
  );
}
