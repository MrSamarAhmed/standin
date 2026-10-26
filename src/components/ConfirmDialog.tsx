import { useEffect, useId, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { DialogState } from '../lib/types';

interface DialogCopy {
  title: string;
  body: string;
  note?: string;
  confirm: string;
  danger?: boolean;
}

export function ConfirmDialog({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previous?.focus();
    };
  }, [dialog, onCancel]);

  if (!dialog) return null;
  const copy = dialogCopy(dialog);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="dialog-icon" aria-hidden="true">
          <TriangleAlert size={20} strokeWidth={1.7} />
        </div>
        <h2 id={titleId}>{copy.title}</h2>
        <p>{copy.body}</p>
        {copy.note && <p className="dialog-note">{copy.note}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} ref={cancelRef}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${copy.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function dialogCopy(dialog: NonNullable<DialogState>): DialogCopy {
  switch (dialog.kind) {
    case 'edit':
      return {
        title: 'Edit this document?',
        body: 'Editing clears the scan, the cast, and any safe copy made from this document.',
        note: 'You will need to scan again before sharing.',
        confirm: 'Edit text',
        danger: true,
      };
    case 'reset':
      return {
        title: 'Start over?',
        body: 'This clears the document, cast, safe copy, and any AI answer from this tab.',
        note: 'Nothing is saved, so this cannot be undone.',
        confirm: 'Start over',
        danger: true,
      };
    case 'replace-sample':
      return {
        title: 'Replace this document with the sample?',
        body: 'The current document and cast will be cleared. Any safe copy and restore mapping will be replaced.',
        confirm: 'Load sample',
      };
    case 'replace-text':
      return {
        title: 'Replace the current document?',
        body: `Loading “${dialog.label}” clears the scan, cast, and safe copy.`,
        note: 'Nothing is saved to disk, so the current document cannot be recovered.',
        confirm: 'Load document',
      };
  }
}
