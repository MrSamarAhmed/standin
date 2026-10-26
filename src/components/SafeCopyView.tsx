import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { splitTokenSegments } from '../lib/restore';
import type { SafeSnapshot } from '../lib/types';
import { formatCount, pluralize, TYPE_LABELS } from '../lib/types';
import { LeakCard } from './LeakCard';
import { TypeIcon } from './TypeIcon';

interface SafeCopyViewProps {
  safeCopy: SafeSnapshot;
  safeStale: boolean;
  copyAck: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onBack: () => void;
  onCopyAck: (value: boolean) => void;
  onUpdate: () => void;
}

export function SafeCopyView({
  safeCopy,
  safeStale,
  copyAck,
  onCopy,
  onDownload,
  onBack,
  onCopyAck,
  onUpdate,
}: SafeCopyViewProps) {
  const hasLeaks = safeCopy.leaks.length > 0;
  const blocked = safeStale || (hasLeaks && !copyAck);
  const segments = splitTokenSegments(safeCopy.text);
  const usedStandIns = safeCopy.unprotected
    ? 0
    : new Set(
        segments.filter((segment) => segment.kind === 'token').map((segment) => segment.text),
      ).size;

  const title = safeStale
    ? 'This copy is out of date.'
    : safeCopy.unprotected
      ? 'An unprotected copy.'
      : hasLeaks
        ? 'Some details still need attention.'
        : 'Ready to share.';

  const lede = safeStale
    ? 'The cast changed after this copy was made. Update the copy before sharing it, or the restore mapping will not match what the AI sees.'
    : safeCopy.unprotected
      ? hasLeaks
        ? 'No automatic protection was applied, and the leak check still finds sensitive text. Review the list and explicitly acknowledge the risk before copying.'
        : 'No automatic protection was applied. This is the original text, kept available only because you acknowledged the risk.'
      : hasLeaks
        ? 'The leak check found text that still looks sensitive. Review the list, then go back to the cast or explicitly acknowledge the risk.'
        : 'Every selected original was replaced with its stand-in. Paste this into your AI tool, then keep this tab open to restore the answer.';

  const blockReason = safeStale
    ? 'Update the safe copy to match the current cast before copying.'
    : hasLeaks && !copyAck
      ? 'Acknowledge the remaining leaks in the verification card before copying.'
      : null;

  return (
    <div className="safe-step">
      <header className="step-intro">
        <p className="eyebrow">Step two · Safe copy</p>
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>

      <div className="workspace-grid">
        <div className="workspace-main">
          {safeStale && (
            <div className="stale-banner" role="status">
              <AlertTriangle size={19} strokeWidth={1.8} aria-hidden="true" />
              <div className="stale-copy">
                <strong>Out of date</strong>
                <p>
                  The current cast differs from the snapshot used to make this copy. Update it to
                  include your latest choices.
                </p>
              </div>
              <button type="button" className="btn btn-secondary btn-small" onClick={onUpdate}>
                <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
                Update safe copy
              </button>
            </div>
          )}

          <div className="safe-toolbar">
            <div className="safe-toolbar-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCopy}
                disabled={blocked}
                aria-describedby={blockReason ? 'safe-block-reason' : undefined}
              >
                <Copy size={16} strokeWidth={1.9} aria-hidden="true" />
                Copy safe copy
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onDownload}
                disabled={blocked}
              >
                <Download size={16} strokeWidth={1.8} aria-hidden="true" />
                Download .txt
              </button>
              <button type="button" className="btn btn-quiet" onClick={onBack}>
                <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                Back to review
              </button>
            </div>
            <span
              className={`safe-status ${
                safeStale
                  ? 'is-stale'
                  : safeCopy.unprotected
                    ? 'is-warn'
                    : hasLeaks
                      ? 'is-fail'
                      : 'is-pass'
              }`}
            >
              {safeStale
                ? 'Out of date'
                : safeCopy.unprotected
                  ? 'Unprotected'
                  : hasLeaks
                    ? pluralize(safeCopy.leaks.length, 'leak')
                    : '0 leaks'}
            </span>
          </div>

          {blockReason && (
            <p className="safe-block-reason" id="safe-block-reason">
              <Info size={14} strokeWidth={1.9} aria-hidden="true" />
              {blockReason}
            </p>
          )}

          <div className="paper-card safe-paper-card">
            <div className="safe-paper-head">
              <div>
                <p className="eyebrow">Prepared locally</p>
                <h2>Safe copy</h2>
              </div>
              <div className="safe-meta">
                <span>{formatCount(safeCopy.text.length)} characters</span>
                <span className="meta-dot" aria-hidden="true">
                  ·
                </span>
                <span>{pluralize(usedStandIns, 'stand-in')}</span>
              </div>
            </div>

            <div
              className="document-text safe-text"
              id="safe-copy-text"
              aria-label="Safe copy text"
            >
              {segments.map((segment, index) =>
                segment.kind === 'token' ? (
                  <mark className="token-pill safe-token" key={`token-${index}`}>
                    {segment.text}
                  </mark>
                ) : (
                  <span key={`text-${index}`}>{segment.text}</span>
                ),
              )}
            </div>

            <p className="safe-footnote">
              {safeCopy.unprotected ? (
                <AlertTriangle size={13} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
              )}
              {safeCopy.unprotected
                ? 'No stand-ins were added. This copy is the unprotected original.'
                : 'The stand-ins are consistent across the document. The cast stays in this tab.'}
            </p>
          </div>

          {!blocked && (
            <p className="safe-share-note">
              <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
              StandIn does not send this copy anywhere. Paste it into the AI tool you already use,
              then return to Restore with the answer.
            </p>
          )}
        </div>

        <aside className="workspace-rail">
          <LeakCard safeCopy={safeCopy} copyAck={copyAck} onCopyAck={onCopyAck} />
          <CastSheet safeCopy={safeCopy} />
        </aside>
      </div>
    </div>
  );
}

function CastSheet({ safeCopy }: { safeCopy: SafeSnapshot }) {
  return (
    <section className="paper-card cast-sheet" aria-labelledby="cast-sheet-title">
      <div className="cast-panel-head">
        <div>
          <p className="eyebrow">Cast sheet</p>
          <h2 id="cast-sheet-title">The snapshot used here</h2>
        </div>
        <span className="sheet-count">{formatCount(safeCopy.cast.length)}</span>
      </div>
      <p className="sheet-note">
        Restore uses this exact mapping, not later cast edits. It stays in this tab only.
      </p>
      {safeCopy.cast.length > 0 ? (
        <ul className="sheet-list">
          {safeCopy.cast.map((entry) => (
            <li key={entry.token}>
              <code className="token-pill">{entry.token}</code>
              <span className="sheet-name">{entry.display}</span>
              <span className="sheet-type">
                <TypeIcon type={entry.type} size={12} />
                {TYPE_LABELS[entry.type]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sheet-empty">No stand-ins are in this copy.</p>
      )}
    </section>
  );
}
