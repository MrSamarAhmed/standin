import { useState, type FormEvent } from 'react';
import { ArrowRight, CircleSlash2, Info, LockKeyhole, Plus } from 'lucide-react';
import type { CastEntry } from '../lib/types';
import { ENTITY_TYPES, formatCount, pluralize, TYPE_LABELS } from '../lib/types';
import { CastRow } from './CastRow';
import { TypeIcon } from './TypeIcon';

interface CastPanelProps {
  cast: CastEntry[];
  rawText: string;
  acceptedEntries: number;
  totalEntries: number;
  plannedReplacements: number;
  unprotectedAck: boolean;
  onToggle: (key: string) => void;
  onSetAll: (accepted: boolean) => void;
  onAddCustom: (term: string) => string | null;
  onSetUnprotectedAck: (value: boolean) => void;
  onCreateSafeCopy: () => boolean;
}

export function CastPanel({
  cast,
  rawText,
  acceptedEntries,
  totalEntries,
  plannedReplacements,
  unprotectedAck,
  onToggle,
  onSetAll,
  onAddCustom,
  onSetUnprotectedAck,
  onCreateSafeCopy,
}: CastPanelProps) {
  const [term, setTerm] = useState('');
  const [termError, setTermError] = useState<string | null>(null);
  const [termAdded, setTermAdded] = useState(false);

  const allSelected = totalEntries > 0 && acceptedEntries === totalEntries;
  const hasSelection = acceptedEntries > 0;

  const groups = ENTITY_TYPES.map((type) => ({
    type,
    entries: cast.filter((entry) => entry.type === type),
  })).filter((group) => group.entries.length > 0);

  function submitTerm(event: FormEvent) {
    event.preventDefault();
    const error = onAddCustom(term);
    if (error) {
      setTermError(error);
      setTermAdded(false);
      return;
    }
    setTerm('');
    setTermError(null);
    setTermAdded(true);
  }

  return (
    <aside className="cast-panel paper-card" aria-labelledby="cast-title">
      <div className="cast-panel-head">
        <div>
          <p className="eyebrow">The cast</p>
          <h2 id="cast-title">Who becomes what</h2>
        </div>
        <button
          type="button"
          className="btn btn-quiet btn-small cast-select-all"
          onClick={() => onSetAll(!allSelected)}
          disabled={totalEntries === 0}
        >
          {allSelected ? 'Select none' : 'Select all'}
        </button>
      </div>

      <p className="cast-summary">
        <span>
          <strong>{formatCount(acceptedEntries)}</strong> of {formatCount(totalEntries)} selected
        </span>
        <span className="summary-divider" aria-hidden="true" />
        <span>
          <strong>{formatCount(plannedReplacements)}</strong>{' '}
          {plannedReplacements === 1 ? 'replacement' : 'replacements'} planned
        </span>
      </p>

      <div className="cast-body">
        {totalEntries === 0 && (
          <div className="cast-empty">
            <CircleSlash2 size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3>No likely sensitive details found</h3>
            <p>
              That is not a clean bill of health. The detectors can miss a name, nickname, or
              unusual identifier. Add anything you know is sensitive before making a safe copy.
            </p>
          </div>
        )}

        {hasSelection && (
          <p className="cast-instruction">
            Click a row or a highlight to keep it as written. Exact repeats are replaced too, even
            when a repeat was not highlighted. The token is what the AI will see.
          </p>
        )}

        {groups.map((group) => (
          <section className="cast-group" key={group.type} aria-label={TYPE_LABELS[group.type]}>
            <header className="cast-group-head">
              <TypeIcon type={group.type} size={13} />
              <h3>{TYPE_LABELS[group.type]}</h3>
              <span className="group-count">{formatCount(group.entries.length)}</span>
            </header>
            <ul className="cast-list">
              {group.entries.map((entry) => (
                <CastRow key={entry.key} entry={entry} rawText={rawText} onToggle={onToggle} />
              ))}
            </ul>
          </section>
        ))}

        {totalEntries > 0 && !hasSelection && (
          <div className="cast-empty is-warn">
            <Info size={19} strokeWidth={1.7} aria-hidden="true" />
            <h3>Nothing is selected</h3>
            <p>
              Every detail is set to stay as written. You can select rows again, or make an
              unprotected copy below after acknowledging the risk.
            </p>
          </div>
        )}

        <form className="custom-term" onSubmit={submitTerm}>
          <label htmlFor="custom-term-input">
            <Plus size={13} strokeWidth={2} aria-hidden="true" />
            Add a missed term
          </label>
          <div className="custom-term-row">
            <input
              id="custom-term-input"
              type="text"
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setTermError(null);
                setTermAdded(false);
              }}
              placeholder="A codename, client, or nickname"
              maxLength={120}
              autoComplete="off"
              aria-describedby="custom-term-help"
              aria-invalid={termError ? true : undefined}
              aria-errormessage={termError ? 'custom-term-error' : undefined}
            />
            <button type="submit" className="btn btn-secondary btn-small" disabled={!term.trim()}>
              Add
            </button>
          </div>
          <p className="custom-term-help" id="custom-term-help">
            Every case-insensitive occurrence is added with one <code>[CUSTOM_n]</code> token.
          </p>
          {termError && (
            <p className="inline-error" id="custom-term-error" role="alert">
              {termError}
            </p>
          )}
          {termAdded && !termError && (
            <p className="inline-success" role="status">
              Added to the cast.
            </p>
          )}
        </form>
      </div>

      <div className="cast-footer">
        {hasSelection ? (
          <>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={onCreateSafeCopy}
            >
              Create safe copy
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <p className="cast-footer-note">
              <LockKeyhole size={12} strokeWidth={1.8} aria-hidden="true" />
              {pluralize(plannedReplacements, 'replacement')} planned. You can review the safe copy
              before copying it.
            </p>
          </>
        ) : (
          <div className="unprotected-callout">
            <div className="unprotected-heading">
              <Info size={16} strokeWidth={1.8} aria-hidden="true" />
              <strong>No automatic protection will be applied</strong>
            </div>
            <p>
              Every original detail will stay in the copy. Only do this if you have reviewed the
              document and accept the risk.
            </p>
            <label className="ack-check">
              <input
                type="checkbox"
                checked={unprotectedAck}
                onChange={(event) => onSetUnprotectedAck(event.target.checked)}
              />
              <span>I understand this copy will be unprotected.</span>
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={onCreateSafeCopy}
              disabled={!unprotectedAck}
            >
              Create copy without changes
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
