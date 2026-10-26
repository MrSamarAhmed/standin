import { Check, ChevronDown } from 'lucide-react';
import type { CastEntry, Detection, DetectionSource } from '../lib/types';
import { formatCount, pluralize, TYPE_LABELS } from '../lib/types';
import { TypeIcon } from './TypeIcon';

function sourceLabel(source: DetectionSource, confidence: number): string {
  if (source === 'custom') return 'Added by you';
  if (source === 'pattern') return 'Pattern match';
  return `Private model · ${Math.round(confidence * 100)}%`;
}

function MentionContext({ rawText, mention }: { rawText: string; mention: Detection }) {
  const from = Math.max(0, mention.start - 42);
  const to = Math.min(rawText.length, mention.end + 42);
  const before = rawText.slice(from, mention.start).replace(/\s+/g, ' ');
  const after = rawText.slice(mention.end, to).replace(/\s+/g, ' ');
  const mentionText = rawText
    .slice(mention.start, mention.end)
    .replace(/\s+/g, ' ');

  return (
    <span>
      {from > 0 && '…'}
      {before}
      <mark className="context-mark">{mentionText}</mark>
      {after}
      {to < rawText.length && '…'}
    </span>
  );
}

export function CastRow({
  entry,
  rawText,
  onToggle,
}: {
  entry: CastEntry;
  rawText: string;
  onToggle: (key: string) => void;
}) {
  const mentionLabel = pluralize(entry.mentions.length, 'mention');

  return (
    <li className={`cast-row ${entry.accepted ? '' : 'is-kept'}`}>
      <button
        type="button"
        className="cast-toggle"
        aria-pressed={entry.accepted}
        onClick={() => onToggle(entry.key)}
        title={
          entry.accepted
            ? `Click to keep “${entry.display}” as written`
            : `Click to replace “${entry.display}” with ${entry.token}`
        }
      >
        <span className="cast-check" aria-hidden="true">
          {entry.accepted && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="cast-identity">
          <span className="cast-display">{entry.display}</span>
          <span className="cast-meta">
            <TypeIcon type={entry.type} size={12} />
            {TYPE_LABELS[entry.type]}
            <span className="meta-dot" aria-hidden="true">
              ·
            </span>
            {sourceLabel(entry.source, entry.confidence)}
            <span className="meta-dot" aria-hidden="true">
              ·
            </span>
            {mentionLabel}
          </span>
        </span>
        <code className="token-pill">{entry.token}</code>
      </button>

      <details className="cast-mentions">
        <summary>
          <span>{pluralize(entry.mentions.length, 'detected mention')}</span>
          <ChevronDown size={13} strokeWidth={2} aria-hidden="true" className="summary-chevron" />
        </summary>
        <ul className="mention-list">
          {entry.mentions.map((mention, index) => (
            <li key={mention.id}>
              <span className="mention-index">{formatCount(index + 1)}</span>
              <span className="mention-context">
                <MentionContext rawText={rawText} mention={mention} />
              </span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
