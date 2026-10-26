import { FileText, LockKeyhole, RotateCcw } from 'lucide-react';

export function Header({
  hasWork,
  onLoadSample,
  onStartOver,
}: {
  hasWork: boolean;
  onLoadSample: () => void;
  onStartOver: () => void;
}) {
  return (
    <header className="site-header">
      <div className="brand" aria-label="StandIn">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="wordmark">StandIn</span>
      </div>

      <div className="header-actions">
        <a
          className="local-badge"
          href="#privacy"
          aria-label="Local only — read privacy and limits"
          onClick={() => {
            const details = document.getElementById('privacy');
            if (details instanceof HTMLDetailsElement) details.open = true;
          }}
        >
          <LockKeyhole size={13} strokeWidth={2} aria-hidden="true" />
          <span>Local only</span>
        </a>
        <button
          type="button"
          className="btn btn-quiet btn-small"
          onClick={onLoadSample}
          aria-label="Load sample memo"
        >
          <FileText size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>Sample</span>
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-small"
          onClick={onStartOver}
          disabled={!hasWork}
          aria-label="Start over"
        >
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Start over</span>
        </button>
      </div>
    </header>
  );
}
