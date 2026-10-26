import type { Step } from '../lib/types';

const STEPS: { key: Step; number: string; label: string }[] = [
  { key: 'prepare', number: '1', label: 'Prepare' },
  { key: 'safe', number: '2', label: 'Safe copy' },
  { key: 'restore', number: '3', label: 'Restore' },
];

export function Stepper({
  step,
  hasSafeCopy,
  onStep,
}: {
  step: Step;
  hasSafeCopy: boolean;
  onStep: (step: Step) => void;
}) {
  return (
    <nav className="stepper" aria-label="Workspace steps">
      <ol>
        {STEPS.map((item, index) => {
          const active = step === item.key;
          const disabled = item.key === 'safe' && !hasSafeCopy;
          return (
            <li key={item.key} className={active ? 'is-active' : undefined}>
              {index > 0 && <span className="step-line" aria-hidden="true" />}
              <button
                type="button"
                className="step-button"
                aria-current={active ? 'step' : undefined}
                disabled={disabled}
                onClick={() => onStep(item.key)}
              >
                <span className="step-number">{item.number}</span>
                <span className="step-label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
