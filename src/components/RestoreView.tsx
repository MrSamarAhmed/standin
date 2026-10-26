import {
  ArrowRight,
  Copy,
  Info,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import type { RestoreReport, RestoredSegment, SafeSnapshot } from '../lib/types';
import { formatCount, pluralize, TYPE_LABELS } from '../lib/types';
import { RestoredText } from './RestoredText';
import { TypeIcon } from './TypeIcon';

interface RestoreViewProps {
  safeCopy: SafeSnapshot | null;
  restoreInput: string;
  restoredOutput: string | null;
  restoreSegments: RestoredSegment[] | null;
  restoreReport: RestoreReport | null;
  onInput: (text: string) => void;
  onRestore: () => void;
  onReset: () => void;
  onCopy: () => void;
  onPrepare: () => void;
}

export function RestoreView({
  safeCopy,
  restoreInput,
  restoredOutput,
  restoreSegments,
  restoreReport,
  onInput,
  onRestore,
  onReset,
  onCopy,
  onPrepare,
}: RestoreViewProps) {
  if (!safeCopy) {
    return (
      <div className="restore-empty-wrap">
        <section className="paper-card restore-empty" aria-labelledby="restore-empty-title">
          <div className="empty-seal" aria-hidden="true">
            <ShieldCheck size={26} strokeWidth={1.5} />
          </div>
          <p className="eyebrow">Step three · Restore</p>
          <h1 id="restore-empty-title">Nothing to restore yet.</h1>
          <p className="restore-empty-lede">
            Restore needs a safe copy and the cast that made it. Prepare a document, create the
            safe copy, then bring the AI&apos;s answer back here.
          </p>
          <button type="button" className="btn btn-primary" onClick={onPrepare}>
            Prepare a document
            <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>
          <p className="restore-empty-note">
            <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
            Restore never calls an AI and never sends the mapping anywhere.
          </p>
        </section>
      </div>
    );
  }

  const hasOutput = restoredOutput !== null && restoreSegments !== null;
  const report = restoreReport;
  const noTokens = Boolean(report && report.totalTokens === 0);
  const unknownTokens = report?.unknown ?? [];
  const unknownCounts = new Map<string, number>();
  for (const token of unknownTokens) {
    unknownCounts.set(token, (unknownCounts.get(token) ?? 0) + 1);
  }

  const title = !hasOutput
    ? 'Bring back the real details.'
    : noTokens
      ? 'No stand-ins found.'
      : 'The real details are back.';

  const lede = !hasOutput
    ? 'Paste the answer from your AI tool. StandIn will look up each stand-in in the safe-copy snapshot and replace it locally.'
    : noTokens
      ? 'The answer contains no recognizable stand-ins. The AI may have removed or rewritten them, so the text below is unchanged.'
      : unknownTokens.length > 0
        ? 'Recognized stand-ins were restored. Unknown tokens were left exactly as written and listed below.'
        : 'Every recognized stand-in was replaced with its original from the safe-copy cast. Nothing was guessed.';

  return (
    <div className="restore-step">
      <header className="step-intro">
        <p className="eyebrow">Step three · Restore</p>
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>

      <div className="workspace-grid">
        <div className="workspace-main">
          {!hasOutput ? (
            <section className="paper-card restore-input-card">
              <div className="desk-header">
                <div>
                  <p className="eyebrow">The AI&apos;s answer</p>
                  <h2 className="desk-title">Paste what came back</h2>
                </div>
                <span className="char-count">
                  {formatCount(restoreInput.length)} characters
                </span>
              </div>

              <label className="visually-hidden" htmlFor="restore-input">
                Paste the AI&apos;s answer
              </label>
              <textarea
                id="restore-input"
                className="document-input restore-input"
                value={restoreInput}
                onChange={(event) => onInput(event.target.value)}
                placeholder="Paste the answer here. It should still contain stand-ins like [PERSON_1]."
              />

              <p className="token-hint">
                Stand-ins look like <code>[PERSON_1]</code> or <code>[ORG_2]</code>. Minor case,
                space, and hyphen changes are tolerated.
              </p>

              <div className="restore-actions">
                <p className="editor-hint">
                  <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
                  No network call. Lookup runs against the safe-copy cast.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRestore}
                  disabled={!restoreInput.trim()}
                >
                  Restore real details
                  <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : (
            <>
              <div className="restore-toolbar">
                <button type="button" className="btn btn-primary" onClick={onCopy}>
                  <Copy size={16} strokeWidth={1.9} aria-hidden="true" />
                  Copy restored answer
                </button>
                <button type="button" className="btn btn-secondary" onClick={onReset}>
                  <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
                  Restore another answer
                </button>
              </div>

              {report && (
                <div className="result-stats" role="status">
                  <span className="stat-pill is-pass">
                    <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
                    {formatCount(report.restored)} restored
                  </span>
                  <span
                    className={`stat-pill ${unknownTokens.length > 0 ? 'is-warn' : 'is-muted'}`}
                  >
                    <Info size={14} strokeWidth={2} aria-hidden="true" />
                    {formatCount(unknownTokens.length)} unknown
                  </span>
                  <span className="result-total">
                    {pluralize(report.totalTokens, 'stand-in token')} recognized
                  </span>
                </div>
              )}

              {noTokens && (
                <div className="notice-banner is-warn" role="status">
                  <TriangleAlert size={18} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <strong>The AI may have removed the stand-ins</strong>
                    <p>
                      No tokens such as <code>[PERSON_1]</code> were found. The answer is shown
                      unchanged below; there was nothing to restore.
                    </p>
                  </div>
                </div>
              )}

              <section className="paper-card restore-output-card">
                <div className="desk-header">
                  <div>
                    <p className="eyebrow">Restored answer</p>
                    <h2 className="desk-title">With real details</h2>
                  </div>
                  <span className="char-count">
                    {formatCount(restoredOutput.length)} characters
                  </span>
                </div>

                <RestoredText segments={restoreSegments} />

                {unknownCounts.size > 0 && (
                  <div className="unknown-panel">
                    <div className="unknown-head">
                      <TriangleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
                      <h3>Unknown stand-ins</h3>
                    </div>
                    <p>
                      These tokens were not in the safe-copy cast, so they were left exactly as
                      written. Check whether the AI invented them or used a different copy.
                    </p>
                    <ul className="unknown-list">
                      {[...unknownCounts.entries()].map(([token, count]) => (
                        <li key={token}>
                          <code>{token}</code>
                          {count > 1 && <span>×{formatCount(count)}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="safe-footnote">
                  <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
                  This answer exists only in this tab. Copy it before refreshing or starting over.
                </p>
              </section>
            </>
          )}
        </div>

        <aside className="workspace-rail">
          <HowRestoreCard />
          <RestoreCastSheet safeCopy={safeCopy} />
        </aside>
      </div>
    </div>
  );
}

function HowRestoreCard() {
  return (
    <section className="paper-card how-card" aria-labelledby="how-restore-title">
      <p className="eyebrow">How restore works</p>
      <h2 id="how-restore-title">A local lookup</h2>
      <ol className="restore-steps">
        <li>
          <span className="step-index">01</span>
          <div>
            <strong>Paste the answer</strong>
            <p>Use whatever the AI returned. The stand-ins should still be in the text.</p>
          </div>
        </li>
        <li>
          <span className="step-index">02</span>
          <div>
            <strong>Match the tokens</strong>
            <p>
              Each token is looked up in the cast that made this safe copy. Case and spacing
              variations are tolerated.
            </p>
          </div>
        </li>
        <li>
          <span className="step-index">03</span>
          <div>
            <strong>Read the real details</strong>
            <p>Known tokens become the original text. Unknown ones stay visible, never guessed.</p>
          </div>
        </li>
      </ol>
      <div className="how-note">
        <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
        <p>The cast never went to the AI, and this mapping never leaves the tab.</p>
      </div>
    </section>
  );
}

function RestoreCastSheet({ safeCopy }: { safeCopy: SafeSnapshot }) {
  return (
    <section className="paper-card restore-cast" aria-labelledby="restore-cast-title">
      <div className="cast-panel-head">
        <div>
          <p className="eyebrow">The cast</p>
          <h2 id="restore-cast-title">In this session</h2>
        </div>
        <span className="sheet-count">{formatCount(safeCopy.cast.length)}</span>
      </div>
      <p className="sheet-note">
        These are the stand-ins restore can recognize. Tokens outside this list are reported, not
        replaced.
      </p>
      {safeCopy.cast.length > 0 ? (
        <ul className="sheet-list is-compact">
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
        <p className="sheet-empty">No stand-ins are in this cast.</p>
      )}
    </section>
  );
}
