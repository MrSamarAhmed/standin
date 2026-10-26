import type { StandInController } from '../hooks/useStandIn';
import { ConfirmDialog } from './ConfirmDialog';
import { Header } from './Header';
import { PreparePanel } from './PreparePanel';
import { PrivacyDisclosure } from './PrivacyDisclosure';
import { RestoreView } from './RestoreView';
import { SafeCopyView } from './SafeCopyView';
import { Stepper } from './Stepper';
import { Toast } from './Toast';

export function AppShell({ standIn }: { standIn: StandInController }) {
  const hasWork = Boolean(
    standIn.rawText.trim() || standIn.safeCopy || standIn.restoreInput.trim(),
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>

      <div className="app-top">
        <div className="app-top-inner">
          <Header
            hasWork={hasWork}
            onLoadSample={standIn.loadSample}
            onStartOver={standIn.requestStartOver}
          />
          <Stepper
            step={standIn.step}
            hasSafeCopy={Boolean(standIn.safeCopy)}
            onStep={standIn.goStep}
          />
        </div>
      </div>

      <main id="workspace" className="app-main">
        <div className="app-main-inner">
          <div className="step-panel" key={standIn.step}>
            {standIn.step === 'prepare' && <PreparePanel standIn={standIn} />}
            {standIn.step === 'safe' &&
              (standIn.safeCopy ? (
                <SafeCopyView
                  safeCopy={standIn.safeCopy}
                  safeStale={standIn.safeStale}
                  copyAck={standIn.copyAck}
                  onCopy={standIn.copySafeCopy}
                  onDownload={standIn.downloadSafeCopy}
                  onBack={() => standIn.goStep('prepare')}
                  onCopyAck={standIn.setCopyAck}
                  onUpdate={() => {
                    standIn.createSafeCopy();
                  }}
                />
              ) : (
                <PreparePanel standIn={standIn} />
              ))}
            {standIn.step === 'restore' && (
              <RestoreView
                safeCopy={standIn.safeCopy}
                restoreInput={standIn.restoreInput}
                restoredOutput={standIn.restoredOutput}
                restoreSegments={standIn.restoreSegments}
                restoreReport={standIn.restoreReport}
                onInput={standIn.setRestoreInput}
                onRestore={standIn.restore}
                onReset={standIn.resetRestore}
                onCopy={standIn.copyRestored}
                onPrepare={() => standIn.goStep('prepare')}
              />
            )}
          </div>
        </div>
      </main>

      <div className="app-footer-wrap">
        <PrivacyDisclosure />
      </div>

      <ConfirmDialog
        dialog={standIn.dialog}
        onConfirm={standIn.confirmDialog}
        onCancel={standIn.cancelDialog}
      />
      <Toast toast={standIn.toast} onDismiss={standIn.dismissToast} />
    </div>
  );
}
