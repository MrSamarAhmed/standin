import { LockKeyhole } from 'lucide-react';

export function PrivacyDisclosure() {
  return (
    <footer className="site-footer">
      <p className="footer-line">
        Runs in your browser. No uploads. No accounts. The cast lasts only for this tab.
      </p>
      <details className="privacy-disclosure" id="privacy">
        <summary>
          <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
          Privacy &amp; limits
        </summary>
        <div className="privacy-body">
          <div>
            <h3>Where your document goes</h3>
            <p>
              Nowhere. Text, highlights, tokens, and the restore map live in this tab&apos;s
              memory only. StandIn has no backend, analytics, accounts, or document storage. It
              does not write document content to <code>localStorage</code> or{' '}
              <code>sessionStorage</code>.
            </p>
          </div>
          <div>
            <h3>The detector</h3>
            <p>
              Names are found with a quantized DistilBERT-NER model bundled with the app. The
              browser reads those static files from this site, not from a third party. Emails,
              phones, identifiers, money, addresses, and links use local patterns. The model and
              your text never leave this tab.
            </p>
          </div>
          <div>
            <h3>What it can miss</h3>
            <p>
              Detection is probabilistic and English-focused. It can miss a name, nickname,
              project code, or unusual identifier. The leak check catches structured patterns,
              known originals, and broken tokens—not an unknown name neither detector saw. Review
              the cast and add missed terms before sharing.
            </p>
          </div>
          <div>
            <h3>Your AI tool is separate</h3>
            <p>
              StandIn prepares the safe copy; it does not call an AI service. Once you paste the
              copy into another tool, that service&apos;s privacy terms apply. Keep this tab open
              until you have restored the answer.
            </p>
          </div>
          <div>
            <h3>Model attribution</h3>
            <p>
              <code>onnx-community/distilbert-NER-ONNX</code>, converted from{' '}
              <code>dslim/distilbert-NER</code>, Apache-2.0. Model files and the Apache license
              are included in this project.
            </p>
          </div>
        </div>
      </details>
    </footer>
  );
}
