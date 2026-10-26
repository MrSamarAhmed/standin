import {
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { StandInController } from '../hooks/useStandIn';
import type { ScanPhase } from '../lib/types';
import { formatCount } from '../lib/types';
import { CastPanel } from './CastPanel';
import { DocumentEditor } from './DocumentEditor';
import { HighlightedDocument, HighlightLegend } from './HighlightedDocument';

const PHASE_COPY: Record<
  Exclude<ScanPhase, 'idle' | 'done' | 'error'>,
  { title: string; detail: string }
> = {
  chunking: {
    title: 'Splitting the document',
    detail:
      'Long text is divided at paragraph and sentence boundaries so every part fits the detector.',
  },
  patterns: {
    title: 'Checking structured details',
    detail:
      'Looking for emails, phone numbers, identifiers, money, addresses, and links with local patterns.',
  },
  'model-loading': {
    title: 'Loading the private detector',
    detail:
      'The bundled NER model is read from this site. The first scan is the slowest; later scans reuse it.',
  },
  'model-scanning': {
    title: 'Reading names and places',
    detail:
      'Finding people, organizations, locations, and other named things. This runs inside this tab.',
  },
  merging: {
    title: 'Building the cast',
    detail: 'Merging both detectors and giving every unique detail one consistent stand-in.',
  },
};

const TIMELINE = ['Split text', 'Patterns', 'Names', 'Cast'];

export function PreparePanel({ standIn }: { standIn: StandInController }) {
  const {
    rawText,
    documentLabel,
    sampleLoaded,
    isEditing,
    scanning,
    scanPhase,
    scanError,
    modelProgress,
    cast,
    acceptedEntries,
    totalEntries,
    unprotectedAck,
  } = standIn;

  const hasText = rawText.trim().length > 0;
  const reviewing = hasText && !isEditing && scanPhase === 'done';

  if (!hasText) {
    return (
      <DocumentEditor
        rawText={rawText}
        documentLabel={documentLabel}
        sampleLoaded={sampleLoaded}
        scanning={scanning}
        scanError={scanError}
        onTextChange={standIn.setText}
        onScan={standIn.scan}
        onLoadFile={standIn.loadFile}
        onLoadSample={standIn.loadSample}
      />
    );
  }

  return (
    <div className="prepare-step">
      <header className="step-intro">
        <p className="eyebrow">Step one · Prepare</p>
        <h1>
          {reviewing ? 'Review the cast.' : scanning ? 'Reading the document.' : 'Set the document.'}
        </h1>
        <p>
          {reviewing
            ? 'Every highlight is a likely sensitive detail. Accept or reject each one, add anything the detectors missed, then make the safe copy.'
            : scanning
              ? 'The detectors are working locally. Nothing is uploaded, and you can cancel at any point.'
              : 'Paste or load a confidential document. StandIn will find likely sensitive details and propose a consistent cast of stand-ins.'}
        </p>
      </header>

      <div className="workspace-grid">
        <div className="workspace-main">
          {isEditing || scanPhase === 'error' ? (
            <DocumentEditor
              rawText={rawText}
              documentLabel={documentLabel}
              sampleLoaded={sampleLoaded}
              scanning={scanning}
              scanError={scanError}
              onTextChange={standIn.setText}
              onScan={standIn.scan}
              onLoadFile={standIn.loadFile}
              onLoadSample={standIn.loadSample}
            />
          ) : scanning ? (
            <ScanningSurface
              phase={scanPhase}
              progress={modelProgress}
              documentLabel={documentLabel}
              onCancel={standIn.cancelScan}
            />
          ) : (
            <ReviewSurface standIn={standIn} />
          )}
        </div>

        <div className="workspace-rail">
          {reviewing ? (
            <CastPanel
              cast={cast}
              rawText={rawText}
              acceptedEntries={acceptedEntries}
              totalEntries={totalEntries}
              plannedReplacements={standIn.plannedReplacements}
              unprotectedAck={unprotectedAck}
              onToggle={standIn.toggleCast}
              onSetAll={standIn.setAllCast}
              onAddCustom={standIn.addCustomTerm}
              onSetUnprotectedAck={standIn.setUnprotectedAck}
              onCreateSafeCopy={standIn.createSafeCopy}
            />
          ) : (
            <CastPreview scanning={scanning} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSurface({ standIn }: { standIn: StandInController }) {
  const { rawText, documentLabel, sampleLoaded, cast, allMentions, modelStatus } = standIn;
  const fallback = modelStatus === 'fallback';

  return (
    <div className="document-desk">
      {fallback && (
        <div className="fallback-banner" role="status">
          <ShieldAlert size={20} strokeWidth={1.7} aria-hidden="true" />
          <div className="fallback-copy">
            <strong>Patterns-only scan</strong>
            <p>
              Names, organizations, and locations were not checked. Emails, phones, identifiers,
              money, addresses, and links were. Review the document for names, then add any missed
              terms to the cast.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-small" onClick={standIn.scan}>
            <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
            Retry detector
          </button>
        </div>
      )}

      <div className="paper-card review-card">
        <div className="review-head">
          <div>
            <p className="eyebrow">Highlighted document</p>
            <h2 className="desk-title">
              {documentLabel ?? 'Untitled document'}
              {sampleLoaded && <span className="sample-chip">Sample</span>}
            </h2>
            <p className="review-meta">
              {formatCount(rawText.length)} characters ·{' '}
              {allMentions > 0
                ? `${formatCount(allMentions)} likely ${
                    allMentions === 1 ? 'mention' : 'mentions'
                  } highlighted`
                : 'No highlights found'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={standIn.requestEdit}
          >
            <PencilLine size={14} strokeWidth={1.8} aria-hidden="true" />
            Edit text
          </button>
        </div>

        <HighlightLegend />

        <HighlightedDocument rawText={rawText} cast={cast} onToggle={standIn.toggleCast} />

        <p className="review-footnote">
          <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
          The text above is unchanged. Only the safe copy replaces accepted details.
        </p>
      </div>
    </div>
  );
}

function ScanningSurface({
  phase,
  progress,
  documentLabel,
  onCancel,
}: {
  phase: ScanPhase;
  progress: number | null;
  documentLabel: string | null;
  onCancel: () => void;
}) {
  const key = phase === 'idle' || phase === 'done' || phase === 'error' ? null : phase;
  const copy = key ? PHASE_COPY[key] : null;
  const stageIndex =
    phase === 'chunking'
      ? 0
      : phase === 'patterns'
        ? 1
        : phase === 'model-loading' || phase === 'model-scanning'
          ? 2
          : phase === 'merging'
            ? 3
            : -1;

  const percent =
    typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : null;

  return (
    <section className="paper-card scan-card" aria-live="polite" aria-busy="true">
      <div className="scan-kicker">
        <LoaderCircle size={16} strokeWidth={1.9} className="spin" aria-hidden="true" />
        <span>Scanning locally</span>
        <span className="scan-doc-name">{documentLabel ?? 'Your document'}</span>
      </div>

      <h2>{copy?.title ?? 'Scanning'}</h2>
      <p className="scan-detail">{copy?.detail}</p>

      <div
        className={`scan-progress ${percent === null ? 'is-indeterminate' : ''}`}
        role="progressbar"
        aria-label="Local scan progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        <span style={percent === null ? undefined : { width: `${Math.max(percent, 3)}%` }} />
      </div>
      <p className="scan-progress-label">
        {percent === null
          ? 'Starting the local engine…'
          : `Step ${Math.max(stageIndex + 1, 1)} of 4 · ${percent}%`}
      </p>

      <ol className="scan-timeline">
        {TIMELINE.map((label, index) => {
          const state =
            index < stageIndex ? 'is-complete' : index === stageIndex ? 'is-current' : 'is-pending';
          return (
            <li key={label} className={state} aria-current={state === 'is-current' ? 'step' : undefined}>
              <span className="timeline-dot" aria-hidden="true">
                {index < stageIndex ? '✓' : index + 1}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="scan-foot">
        <p>
          <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
          Nothing is uploaded. The model files come from this site.
        </p>
        <button type="button" className="btn btn-quiet btn-small" onClick={onCancel}>
          Cancel scan
        </button>
      </div>
    </section>
  );
}

function CastPreview({ scanning }: { scanning: boolean }) {
  return (
    <aside className="cast-panel paper-card cast-placeholder" aria-label="Cast preview">
      <div className="cast-panel-head">
        <div>
          <p className="eyebrow">The cast</p>
          <h2>Who becomes what</h2>
        </div>
      </div>
      <p className="placeholder-copy">
        {scanning
          ? 'The cast will appear when detection finishes. Each unique detail gets one token that stays consistent across the document.'
          : 'Scan to build a cast. Repeated mentions share one stand-in, so the AI can still follow the document.'}
      </p>
      <ul className="placeholder-list" aria-hidden="true">
        <li>
          <span>Maya Chen</span>
          <code>[PERSON_1]</code>
        </li>
        <li>
          <span>Horizon Labs</span>
          <code>[ORG_1]</code>
        </li>
        <li>
          <span>maya@….example</span>
          <code>[EMAIL_1]</code>
        </li>
      </ul>
      {scanning && (
        <div className="placeholder-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      <div className="placeholder-note">
        <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
        The mapping lives in this tab only.
      </div>
      <div className="placeholder-action">
        <span>After review</span>
        <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
        <span>Safe copy</span>
      </div>
    </aside>
  );
}
