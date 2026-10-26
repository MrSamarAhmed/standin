import { CircleAlert, CircleCheck, X } from 'lucide-react';
import type { ToastMessage } from '../lib/types';

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null;
  onDismiss: (id: number) => void;
}) {
  if (!toast) return null;
  const Icon = toast.tone === 'success' ? CircleCheck : CircleAlert;
  return (
    <div
      className={`toast toast-${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss message"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
