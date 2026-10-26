import type { RestoredSegment } from '../lib/types';
import { TYPE_LABELS } from '../lib/types';

export function RestoredText({ segments }: { segments: RestoredSegment[] }) {
  return (
    <div className="document-text restored-text" id="restored-output" aria-label="Restored answer">
      {segments.map((segment, index) => {
        if (segment.kind === 'restored' && segment.type) {
          return (
            <mark
              key={`restored-${index}`}
              className={`restored-value mention-${segment.type.toLowerCase()}`}
              title={`${TYPE_LABELS[segment.type]} restored from ${segment.token ?? 'a stand-in'}`}
            >
              {segment.text}
            </mark>
          );
        }

        if (segment.kind === 'unknown') {
          return (
            <mark
              key={`unknown-${index}`}
              className="unknown-token"
              title={`Unrecognized stand-in ${segment.token ?? ''}. Left unchanged.`}
            >
              {segment.text}
            </mark>
          );
        }

        return <span key={`plain-${index}`}>{segment.text}</span>;
      })}
    </div>
  );
}
