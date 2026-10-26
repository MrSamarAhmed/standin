import { Info, ShieldAlert } from 'lucide-react';
import { splitTokenSegments } from '../lib/restore';
import type { SafeSnapshot } from '../lib/types';
import { formatCount, pluralize } from '../lib/types';

const KIND_LABELS = {
  pattern: 'Pattern',
  original: 'Original',
  orphanToken: 'Broken token',
} as const;

export function LeakCard({
  safeCopy,
  copyAck,
  onCopyAck,
}: {
  safeCopy: SafeSnapshot;
  copyAck: boolean;
  onCopyAck: (value: boolean) => void;
}) {
  const leaks = safeCopy.leaks;
  const hasLeaks = leaks.length > 0;
  const variant = safeCopy.unprotected ? 'warn' : hasLeaks ? 'fail' : 'pass';
  const appliedStandIns = safeCopy.unprotected
    ? 0
    : new Set(
        splitTokenSegments(safeCopy.text)
          .filter((segment) => segment.kind === 'token')
          .map((segment) => segment.text),
      ).size;

  const checkedTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(safeCopy.checkedAt);

  return (
    <section className="paper-card leak-card" aria-labelledby="leak-title">
      <div className="leak-head">
        <div>
          <p className="eyebrow">Verification</p>
          <h2 id="leak-title">Leak check</h2>
        </div>
        <span className="checked-time">Checked locally · {checkedTime}</span>
      </div>

      <div className={`leak-stamp is-${variant}`} role="status">
        <span className="stamp-main">
          {safeCopy.unprotected ? 'Unprotected' : hasLeaks ? formatCount(leaks.length) : '0'}
        </span>
        <span className="stamp-label">
          {safeCopy.unprotected
            ? 'copy — review required'
            : hasLeaks
              ? pluralize(leaks.length, 'leak') + ' found'
              : 'leaks found'}
        </span>
      </div>

      <p className="leak-summary">
        {safeCopy.unprotected
          ? 'No automatic protection was applied. Every original detail remains in this copy.'
          : hasLeaks
            ? 'The copy still contains occurrences that look sensitive. Review them before copying.'
            : 'No structured data or selected originals remain in this copy.'}
      </p>

      <ul className="verify-stats" aria-label="Protection summary">
        <li>
          <strong>{formatCount(appliedStandIns)}</strong>
          <span>{appliedStandIns === 1 ? 'stand-in' : 'stand-ins'} applied</span>
        </li>
        <li>
          <strong>{formatCount(safeCopy.replacedMentions)}</strong>
          <span>{safeCopy.replacedMentions === 1 ? 'mention' : 'mentions'} covered</span>
        </li>
        <li>
          <strong>{formatCount(safeCopy.cast.length)}</strong>
          <span>{safeCopy.cast.length === 1 ? 'token' : 'tokens'} in cast</span>
        </li>
      </ul>

      {hasLeaks && (
        <ul className="leak-list" aria-label="Remaining leaks">
          {leaks.map((leak, index) => (
            <li key={`${leak.kind}-${leak.text}-${index}`}>
              <div className="leak-item-head">
                <span className={`leak-tag is-${leak.kind}`}>{KIND_LABELS[leak.kind]}</span>
                <code>{leak.text}</code>
              </div>
              <p>{leak.message}</p>
            </li>
          ))}
        </ul>
      )}

      {hasLeaks && (
        <label className="ack-check">
          <input
            type="checkbox"
            checked={copyAck}
            onChange={(event) => onCopyAck(event.target.checked)}
          />
          <span>I reviewed these leaks and want to copy anyway.</span>
        </label>
      )}

      <div className="verify-limit">
        {safeCopy.unprotected ? (
          <ShieldAlert size={16} strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <Info size={16} strokeWidth={1.8} aria-hidden="true" />
        )}
        <p>
          The check finds structured patterns, selected originals, and broken tokens. It cannot
          catch a name that neither detector saw. Your own review is the last line of defense.
        </p>
      </div>
    </section>
  );
}
