import { useRef, useState } from 'react';
import {
  ArrowRight,
  ClipboardPaste,
  FileText,
  FileUp,
  Info,
  LockKeyhole,
  ScanLine,
} from 'lucide-react';
import { SAMPLE_NOTE } from '../lib/sample';
import { CHAR_LIMIT, formatCount } from '../lib/types';

interface DocumentEditorProps {
  rawText: string;
  documentLabel: string | null;
  sampleLoaded: boolean;
  scanning: boolean;
  scanError: string | null;
  onTextChange: (text: string) => void;
  onScan: () => void;
  onLoadFile: (text: string, label: string) => void;
  onLoadSample: () => void;
}

export function DocumentEditor({
  rawText,
  documentLabel,
  sampleLoaded,
  scanning,
  scanError,
  onTextChange,
  onScan,
  onLoadFile,
  onLoadSample,
}: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const hasText = rawText.trim().length > 0;
  const overLimit = rawText.length > CHAR_LIMIT;
  const nearLimit = rawText.length >= CHAR_LIMIT * 0.9;
  const canScan = hasText && !overLimit && !scanning;

  function focusEditor() {
    textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    textareaRef.current?.focus();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);

    if (!/\.(txt|md)$/i.test(file.name)) {
      setFileError('Choose a .txt or .md file. Your current document was left unchanged.');
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setFileError('That file is empty. Your current document was left unchanged.');
        return;
      }
      if (text.length > CHAR_LIMIT) {
        setFileError(
          `That file is ${formatCount(text.length)} characters. The limit is 20,000, so nothing was loaded.`,
        );
        return;
      }
      onLoadFile(text, file.name);
    } catch {
      setFileError('That file could not be read. Your current document was left unchanged.');
    }
  }

  return (
    <section className="document-desk" aria-labelledby="document-desk-title">
      {!hasText && (
        <div className="empty-hero">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            A local-first privacy desk
          </p>
          <h1 className="hero-title">
            Keep the names.
            <span className="hero-title-accent">Share the context.</span>
          </h1>
          <p className="hero-lede">
            StandIn finds likely sensitive details in a confidential document, swaps them for a
            consistent cast of stand-ins, and puts the real details back when the AI answers. The
            document never leaves this tab.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={focusEditor}>
              <ClipboardPaste size={16} strokeWidth={1.8} aria-hidden="true" />
              Paste a document
            </button>
            <button type="button" className="btn btn-secondary" onClick={onLoadSample}>
              <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
              Load sample memo
            </button>
          </div>
          <p className="hero-note">
            No uploads, no account, no API key. Detection is good, not perfect—you review the cast
            before anything is shared.
          </p>
        </div>
      )}

      <div className="paper-card editor-card">
        <div className="desk-header">
          <div>
            <p className="eyebrow" id="document-desk-title">
              {hasText ? 'The document' : 'Start here'}
            </p>
            <h2 className="desk-title">
              {hasText ? (documentLabel ?? 'Untitled document') : 'Paste or load your text'}
              {sampleLoaded && <span className="sample-chip">Sample</span>}
            </h2>
          </div>
          {hasText && (
            <span
              className={`char-count ${overLimit ? 'is-over' : nearLimit ? 'is-near' : ''}`}
              id="document-count"
            >
              {formatCount(rawText.length)} / {formatCount(CHAR_LIMIT)}
            </span>
          )}
        </div>

        {sampleLoaded && hasText && <p className="sample-note">{SAMPLE_NOTE}</p>}

        <label className="visually-hidden" htmlFor="document-input">
          Document text
        </label>
        <textarea
          id="document-input"
          ref={textareaRef}
          className="document-input"
          value={rawText}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste a memo, a client note, an email thread, or a contract excerpt…"
          spellCheck
          aria-describedby="document-hint document-count"
          aria-invalid={overLimit || undefined}
          aria-errormessage={overLimit ? 'document-over-limit' : undefined}
        />

        {overLimit && (
          <p className="inline-error" id="document-over-limit" role="alert">
            <Info size={15} strokeWidth={1.8} aria-hidden="true" />
            This is {formatCount(rawText.length - CHAR_LIMIT)}{' '}
            {rawText.length - CHAR_LIMIT === 1 ? 'character' : 'characters'} over the 20,000 limit.
            Shorten the text to scan; nothing was truncated.
          </p>
        )}

        {fileError && (
          <p className="inline-error" role="alert">
            <Info size={15} strokeWidth={1.8} aria-hidden="true" />
            {fileError}
          </p>
        )}

        {scanError && (
          <p className="inline-error" role="alert">
            <Info size={15} strokeWidth={1.8} aria-hidden="true" />
            {scanError}
          </p>
        )}

        <div className="editor-footer">
          <div className="editor-tools">
            <input
              ref={fileRef}
              type="file"
              className="visually-hidden"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp size={15} strokeWidth={1.8} aria-hidden="true" />
              Load .txt / .md
            </button>
            {!hasText && <span className="editor-tool-note">No words yet</span>}
            {hasText && (
              <span className="editor-tool-note">
                {formatCount(rawText.trim().split(/\s+/).length)} words
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary scan-button"
            onClick={onScan}
            disabled={!canScan}
            aria-describedby="document-hint"
          >
            <ScanLine size={17} strokeWidth={1.9} aria-hidden="true" />
            Scan locally
          </button>
        </div>

        <p className="editor-hint" id="document-hint">
          <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
          {!hasText
            ? 'Paste text, load a file, or use the sample. Scan becomes available when there is text.'
            : 'The model files come from this site. Your document is not uploaded anywhere.'}
        </p>
      </div>

      {!hasText && (
        <ol className="how-strip" aria-label="How StandIn works">
          <li>
            <span className="how-number">01</span>
            <h3>Scan</h3>
            <p>A bundled NER model finds names. Local patterns find emails, IDs, money, and links.</p>
          </li>
          <li>
            <span className="how-number">02</span>
            <h3>Cast</h3>
            <p>Every unique detail gets one consistent stand-in, so the document still reads clearly.</p>
          </li>
          <li>
            <span className="how-number">03</span>
            <h3>Restore</h3>
            <p>The AI answers with stand-ins. StandIn puts the real details back, locally.</p>
          </li>
        </ol>
      )}

      {hasText && (
        <p className="desk-next">
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          When the text looks right, scan it locally. Nothing is sent until you copy the safe copy.
        </p>
      )}
    </section>
  );
}
