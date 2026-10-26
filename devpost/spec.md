---
doc: spec
status: approved
---

<!-- Approved under the learner's standing autonomous-execution brief (2026-10-26).
     Decision provenance is recorded under Decisions and Open Issues. The learner can reopen any decision. -->

# StandIn — Technical Spec

## How This Works, In Plain Language

StandIn is a single web page that does four jobs, all inside the browser tab.

1. **Read the document.** A small named-entity-recognition model — a neural network trained to spot people, organizations, and places — looks for names. A set of hand-written patterns looks for the things a model is bad at: emails, phone numbers, account numbers, money, addresses, and URLs. Both detectors run on your computer. The model files are part of the app, not a service.
2. **Build the cast.** The results are grouped so each unique thing gets one role and one stand-in name: `Alice Johnson` becomes `[PERSON_1]`, and every mention of her uses the same token. The document stays coherent because the cast is consistent.
3. **Make the safe copy.** The app replaces the accepted originals with their tokens. A second, independent pass — the leak check — looks for any structured sensitive data or known originals that survived. You copy this safe text into whichever AI tool you already use.
4. **Restore the answer.** The AI writes back using the tokens. You paste its answer into StandIn, and the app looks up each token in the same cast and puts the real text back. The cast never goes to the AI, and it lives only in this tab.

Why this shape: a server or a cloud LLM would make the privacy promise harder to prove, add keys and costs, and put the demo's critical path behind someone else's uptime. A local detector plus deterministic patterns is a smaller, more honest system for this proof of concept. The tradeoff is that the detector is not perfect and is English-focused; the review step, manual terms, and leak check exist because of that.

## The Core Journey Through the System

The user opens the app → the page is a React application with three steps, all driven by one state hook.
The user pastes text or loads the sample → `DocumentEditor` writes it to `rawText` in the app state. No network call, no storage.
The user clicks **Scan locally** → `useStandIn` asks `chunkText()` for paragraph/sentence chunks, runs `findPatternDetections()` on the main thread, and posts the chunks to `ner.worker.ts`.
The worker initializes the bundled `distilbert-NER` pipeline (loading/quantizing progress goes back to the UI) → for each chunk it returns entities with character offsets relative to the chunk.
The main thread offsets the model entities, merges them with the pattern detections via `mergeDetections()`, and calls `buildCast()` → the state now has a list of `CastEntry` values with stable tokens.
`PreparePanel` renders the source as highlighted spans, and `CastPanel` renders the cast. Clicking a row or mention flips `accepted` on the cast entry; custom terms add another entry.
The user clicks **Create safe copy** → `tokenizeDocument()` replaces all accepted originals in a longest-first combined regex and returns the safe text. The current cast is copied into `safeCast` (the snapshot). `checkLeaks()` runs on the safe text and returns a report. The app switches to the **Safe copy** step.
The user copies the safe text into an AI tool, then comes back and pastes the answer into `RestoreView` → `restoreTokens()` uses `safeCast` to replace tokens and returns both the output and a restore report (restored count, unknown tokens). The app switches to the **Restore** step and highlights the restored values.
**Start over** or a page refresh throws all of that away; nothing was persisted to disk or browser storage.

## Stack

| Layer | Choice | Why / tradeoff |
|---|---|---|
| Build tool | **Vite** (latest stable) with React and TypeScript | Fast dev feedback and a static production build with no server runtime. |
| UI | **React 19** function components, one custom state hook, plain CSS | No router or state library needed for a single-page, three-step tool. Bespoke CSS keeps the editorial design from collapsing into a component-library default. |
| Language | **TypeScript** strict | The cast/token/offset logic is easy to get subtly wrong; types catch span and token mistakes. |
| AI | **`@huggingface/transformers`** (Transformers.js) running the bundled **`onnx-community/distilbert-NER-ONNX`** q8 model in a Web Worker | Real local NER without a key or a server. Tradeoff: ~66 MB model, English CoNLL-2003 entities, browser inference time. |
| Patterns | Hand-written regular expressions + Luhn validation in `src/lib/patterns.ts` | Deterministic, explainable, fast, and reliable for structured identifiers. |
| Icons | **`lucide-react`** | Small, consistent line icons; no custom icon font. |
| Fonts | **`@fontsource-variable/fraunces`**, **`@fontsource-variable/inter`**, **`@fontsource/ibm-plex-mono`** | Bundled, OFL-licensed fonts; no font CDN at runtime. |
| Tests | **Vitest**, **jsdom**, **Testing Library**, **user-event** | Fast unit tests for the pure logic and a core-journey UI test with an injected fake detector. |
| Model verification | A Node smoke script, `npm run verify:model` | Proves the actual model files detect real entities; not a mock. |
| Browser verification | Browser automation / manual browser session | Confirms the worker, model, highlights, copy, and responsive layout in a real browser. |

Major documentation: [Vite](https://vite.dev/guide/), [React](https://react.dev/learn), [TypeScript](https://www.typescriptlang.org/docs/), [Transformers.js](https://huggingface.co/docs/transformers.js), [onnx-community/distilbert-NER-ONNX](https://huggingface.co/onnx-community/distilbert-NER-ONNX), [dslim/distilbert-NER](https://huggingface.co/dslim/distilbert-NER), [Vitest](https://vitest.dev/guide/), [Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Where It Runs and How Someone Tries It

- **Runtime:** a modern desktop or mobile browser with ES modules, Web Workers, WebAssembly, and the Clipboard API. Chrome, Edge, Firefox, and Safari current versions are the target. The app is a static site after `npm run build`; there is no backend and no API key.
- **Environment:** **Node.js 20 or newer** and npm. This session provisioned Node 24.22.1 locally because the machine had no global Node; the README uses the standard command, not the local path.
- **Install:** `npm install`
- **Run for the demo:** `npm run dev`, then open the printed URL (normally `http://localhost:5173`). Load the sample memo.
- **Production check:** `npm run build` then `npm run preview`; open the printed local URL.
- **Tests:** `npm test` and `npm run typecheck`.
- **Real-model smoke test:** `npm run verify:model` (loads the bundled model with Node and prints the entities it finds).
- **Submission:** a 1–3 minute demo video and a public GitHub repository are required. Deployment is optional. If deployed, the static host must serve `public/models/` and the copied ONNX runtime files; the model is fetched from the same origin.
- **No secrets:** there is no `.env` requirement. `.env` files are ignored by `.gitignore` for safety.

## Look and Feel

Carry forward `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- **Palette:** warm paper `#F6F1E8`, surface `#FFFCF6`, ink `#1D1A16`, muted `#6B6358`, rule `#DED3C2`, vermilion `#C4442E`, amber `#F2D98D`, sage `#2F6B5E`, token wash `#E7EFEA`.
- **Typography:** Fraunces variable for the wordmark, headings, and the document reading face; Inter variable for controls and body UI; IBM Plex Mono 400/500 for tokens and counts. Local font files via Fontsource.
- **Surfaces:** paper cards, 1px rules, a subtle warm shadow, no glass or neon. Generous whitespace on desktop; comfortable stacked layout under 900px. The document is the hero, not a dashboard grid.
- **Interaction:** one primary vermilion action per step; secondary actions are outlined or text. A highlighter sweep on scan results, a stamp press on the leak result, and a cross-fade between steps, all disabled under `prefers-reduced-motion`.
- **Tone:** calm, precise, lightly theatrical: "cast," "safe copy," "restore," "mentions." Use "likely" and "review" language; never promise perfect anonymity.
- **Constraints:** no external images or icon fonts; the app must look complete offline after the model assets load. No dark mode in the POC. Use semantic HTML and visible focus rings; color is never the only indicator.

## Components

### `AppShell` and the step machine
Renders the header, privacy badge, stepper, footer, and the current step. Owns the confirmation dialog for destructive transitions. It receives the state and actions from `useStandIn`, so the components stay presentational.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

### `DocumentEditor`
The empty state, paste area, sample loader, `.txt`/`.md` file input, character counter, validation, and **Scan locally** action. It never scans on its own; it calls `onScan` after validation. Loading a file/sample while content exists opens the confirmation dialog.
PRD ref: `prd.md > Starting a document`.

### `PreparePanel`
Composes the editor or highlighted review surface with the cast panel, the scan status, and the patterns-only banner. It is the only step that can start a scan.
PRD ref: `prd.md > Local scanning`, `prd.md > Reviewing and casting`.

### `HighlightedDocument`
Renders the raw text as React spans using detection offsets. Accepted detections get a type-colored highlight; rejected ones get a muted "kept" style. A click on a span toggles the corresponding cast entry. It is read-only; **Edit text** is a separate action. It must render the exact original text (no normalization) and handle adjacent/overlapping spans without dropping characters.
PRD ref: `prd.md > Reviewing and casting`.

### `CastPanel` and `CastRow`
Shows the detection summary, select-all/none, grouped cast rows, mention counts, tokens, source labels, and the custom-term form. A row is a button with `aria-pressed`; a disclosure lists each mention's context. The **Create safe copy** action is here or in the panel footer. If the cast is empty, it shows the no-detections state and the unprotected-copy warning path.
PRD ref: `prd.md > Reviewing and casting`, `prd.md > States and Boundaries`.

### `SafeCopyView`
Renders the tokenized text with token pills, the verification/leak card, the cast snapshot summary, and the copy/download/back actions. It shows **Out of date** when the current cast differs from `safeCast`. A failing leak check blocks the success stamp and requires an explicit copy-anyway acknowledgement.
PRD ref: `prd.md > Create the safe copy`, `prd.md > Leak check`.

### `RestoreView` and `RestoredText`
The paste area for the AI's answer, the restore action, the output with restored highlights, the unknown-token list, and copy/reset actions. If there is no `safeCast`, it shows an empty state with a **Prepare a document** action.
PRD ref: `prd.md > Restore the AI's answer`.

### `useStandIn`
The single state hook. It owns the scan worker lifecycle, the scan phases, the cast, the safe-copy snapshot, the leak acknowledgement, the restore input/output, and the toasts. It exposes narrow actions (`loadSample`, `setText`, `scan`, `toggleCast`, `addCustomTerm`, `createSafeCopy`, `copySafeCopy`, `restore`, `startOver`) and derived counts. The real detector is injectable for tests.
PRD ref: `prd.md > The Core Journey`.

### `ner.worker.ts`
A module Web Worker. It configures Transformers.js for local-only models, loads the q8 pipeline, reports progress, scans each chunk, and posts entities or a structured error. It never sees the user's cast or the safe copy; it receives only the text chunks needed for detection.
PRD ref: `prd.md > Local scanning`.

### `PrivacyDisclosure`
A native `<details>` panel (no JS-only interaction) covering local processing, the model source, session-only storage, the separate privacy terms of the user's AI tool, and detection limits. Reachable from every step via the footer/header.
PRD ref: `prd.md > Privacy and session behavior`.

## Data Model

```ts
type EntityType =
  | 'PERSON' | 'ORG' | 'LOCATION' | 'MISC'
  | 'EMAIL' | 'PHONE' | 'ID' | 'MONEY'
  | 'ADDRESS' | 'URL' | 'CUSTOM';

type DetectionSource = 'model' | 'pattern' | 'custom';

interface Detection {
  id: string;            // `${start}:${end}:${type}` for deterministic keys
  start: number;         // inclusive character offset in rawText
  end: number;           // exclusive
  text: string;          // exact substring, for display
  type: EntityType;
  source: DetectionSource;
  confidence: number;    // 0..1; patterns use a fixed high value
}

interface CastEntry {
  key: string;           // normalized text (trim/collapse/lowercase)
  display: string;       // first occurrence, original casing
  type: EntityType;
  token: string;         // e.g. [PERSON_1]
  accepted: boolean;
  source: DetectionSource;
  confidence: number;
  mentions: Detection[]; // all detections for this entity
}

interface Leak {
  kind: 'pattern' | 'original' | 'orphanToken';
  text: string;
  type?: EntityType;
  message: string;
}

interface RestoreReport {
  restored: number;
  unknown: string[];
  totalTokens: number;
}

interface SafeSnapshot {
  text: string;
  cast: CastEntry[];     // deep-ish copy, frozen for restore
  leaks: Leak[];
  checkedAt: number;
}

interface StandInState {
  step: 'prepare' | 'safe' | 'restore';
  rawText: string;
  scanPhase: 'idle' | 'chunking' | 'patterns' | 'model-loading' | 'model-scanning' | 'merging' | 'done' | 'error';
  scanError: string | null;
  modelStatus: 'unknown' | 'loading' | 'ready' | 'fallback';
  detections: Detection[];
  cast: CastEntry[];
  safeCopy: SafeSnapshot | null;
  safeStale: boolean;
  leakAcknowledged: boolean;
  restoreInput: string;
  restoredOutput: string | null;
  restoreReport: RestoreReport | null;
  dialog: null | { kind: 'replace' | 'reset'; ... };
  toast: null | { tone: 'success' | 'error'; message: string };
}
```

**Where the data lives.**
- All of the above is in the React tree (a `useReducer` or `useState` hook) for the lifetime of the tab. No document text is written to `localStorage`, `sessionStorage`, IndexedDB, cookies, or a server.
- `rawText` is the source of truth. Detections carry offsets into it. The cast is derived from detections + acceptance + custom terms, with tokens assigned deterministically by type and first appearance. The safe copy and the `safeCast` snapshot are created together.
- The model files and fonts are static assets fetched from the app origin. The model is cached by the browser's HTTP cache; the document is never in that request.
- On refresh, the app remounts with an empty state. A `beforeunload` handler warns when there is text. **Start over** clears the state and the worker stays available for a new scan.

**Token assignment.** Sort cast entries by first detection start, then by type order; group by type; assign `1..n` per type. Example: first person in the document `[PERSON_1]`, first organization `[ORG_1]`. If a later scan changes the entity order, tokens can change; this only happens after a rescan, which also invalidates the safe copy. The safe-copy snapshot keeps the mapping stable for the duration of the copy/restore loop.

## File Structure

```
standin/
├── public/
│   ├── models/
│   │   └── onnx-community/
│   │       └── distilbert-NER-ONNX/
│   │           ├── config.json
│   │           ├── tokenizer.json
│   │           ├── tokenizer_config.json
│   │           ├── special_tokens_map.json
│   │           ├── vocab.txt
│   │           ├── onnx/model_quantized.onnx   # ~66 MB q8 weights
│   │           ├── MODEL_ATTRIBUTION.md
│   │           └── LICENSE-APACHE
│   ├── samples/handover-memo.txt
│   ├── ort/                                   # copied ONNX runtime WASM at install
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Header.tsx
│   │   ├── Stepper.tsx
│   │   ├── DocumentEditor.tsx
│   │   ├── PreparePanel.tsx
│   │   ├── HighlightedDocument.tsx
│   │   ├── CastPanel.tsx
│   │   ├── CastRow.tsx
│   │   ├── SafeCopyView.tsx
│   │   ├── LeakCard.tsx
│   │   ├── RestoreView.tsx
│   │   ├── RestoredText.tsx
│   │   ├── PrivacyDisclosure.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   └── TypeIcon.tsx
│   ├── hooks/
│   │   ├── useStandIn.ts
│   │   └── useWorkerScanner.ts
│   ├── lib/
│   │   ├── types.ts
│   │   ├── sample.ts
│   │   ├── patterns.ts
│   │   ├── chunk.ts
│   │   ├── detections.ts
│   │   ├── cast.ts
│   │   ├── tokenize.ts
│   │   ├── leakCheck.ts
│   │   ├── restore.ts
│   │   ├── luhn.ts
│   │   ├── ner.worker.ts
│   │   └── testDetector.ts        # injected only by tests
│   ├── test/
│   │   ├── setup.ts
│   │   ├── patterns.test.ts
│   │   ├── detections.test.ts
│   │   ├── tokenize.test.ts
│   │   ├── leakCheck.test.ts
│   │   ├── restore.test.ts
│   │   ├── chunk.test.ts
│   │   └── app.test.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── scripts/
│   ├── copy-ort.mjs
│   └── verify-model.mjs
├── docs/
│   └── screenshots/               # generated during final verification
├── devpost/
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   ├── checklist.md
│   ├── app-map.html
│   └── learner-profile.md         # gitignored, private
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE
└── README.md
```

## External Services and Dependencies

- **No runtime API or database.** All document processing is client-side. No API keys, accounts, rate limits, or costs.
- **Model source:** [onnx-community/distilbert-NER-ONNX](https://huggingface.co/onnx-community/distilbert-NER-ONNX), converted from [dslim/distilbert-NER](https://huggingface.co/dslim/distilbert-NER). The base model card declares **Apache-2.0**. The q8 ONNX file is ~65.8 MB. It is copied into `public/models/...` at build/setup time; the browser fetches it from the app origin only. Attribution and the Apache-2.0 text live beside the model; the root MIT license covers the application code, not the model.
- **ONNX Runtime Web:** bundled by `@huggingface/transformers`. `scripts/copy-ort.mjs` copies the required `.wasm`/`.mjs` runtime files from `node_modules` into `public/ort/` during `postinstall`; `ner.worker.ts` sets `env.backends.onnx.wasm.wasmPaths = '/ort/'`. If the copy is missing, the app reports a model/engine error and falls back to patterns.
- **Fonts:** npm Fontsource packages, OFL. No Google Fonts call.
- **Clipboard:** `navigator.clipboard.writeText` with a selection fallback when unavailable. The user must click the copy action.
- **File input:** browser `File.text()` for `.txt`/`.md` only. No upload.

## Important Failure Modes

- **The model fails to download/initialize (blocked asset, WASM error, low memory)** → the scan continues with **Patterns only**, a persistent banner explains that names/organizations/locations were not checked, and a **Retry private detector** action is offered. The user's text is never lost.
- **The model misses a sensitive name** → the user can add it as a custom term; the leak check cannot detect an unknown name, so the UI says this plainly and asks for manual review. The product never claims guaranteed anonymity.
- **The document is very long** → input is capped at 20,000 characters and scanned in paragraph/sentence chunks of ≤1,000 characters with overlap; the tail is always included. If chunking or model inference fails, the app falls back to patterns and tells the user which part was not model-scanned.
- **The AI changes or invents a token** → restore normalizes case/spacing/hyphens for known tokens, leaves unknown tokens intact, highlights them, and reports the count. It never guesses a replacement.
- **The clipboard is unavailable** → a toast explains and selects the text for manual copy; the user can still download the safe copy.
- **The safe copy has a leak** → the pass stamp is withheld, the leak list is shown, and copying requires an explicit "Copy anyway" acknowledgement. A stale safe copy (cast edited afterward) must be updated before it can be copied.
- **The user refreshes or navigates away** → session state is gone; a `beforeunload` warning appears while work exists. **Start over** asks for confirmation.
- **A file is the wrong type or unreadable** → a specific error is shown; the current document and cast are preserved.

## What Was Simplified and Why

- **Entity-level cast, exact-string replacement** instead of resolving nicknames, pronouns, and partial names — the latter needs a coreference model and a merge UI; the exact cast proves the reversible loop. The sample uses consistent full names so the demo is clear.
- **Text paste + `.txt`/`.md`** instead of PDF/image OCR — OCR adds a second model, layout reconstruction, and a much harder accuracy story. Text proves the kernel.
- **Session-only memory** instead of encrypted persistence — storing a confidential document in the browser requires key management and a security review. The POC deliberately forgets.
- **Local DistilBERT NER** instead of a larger LLM — no keys, no cost, no upload, and the model can be bundled. The tradeoff is recall and English-only coverage; the UI and review flow are built around that limitation.
- **One deterministic model** instead of an ensemble — a second model would improve recall but double the download and inference cost. The patterns cover structured data; manual terms cover the rest.
- **No built-in AI chat** — the user's existing AI tool is the integration. A built-in chat would require keys, a provider decision, and a third-party data path, and would obscure the privacy layer.

## Decisions and Open Issues

- **Reversible tokenization is the product** — chosen under the learner's brief to select a distinctive kernel. The tradeoff is a mapping that must be handled carefully; the session-only design and the safe-copy snapshot reduce the risk.
- **Local NER + patterns, no cloud LLM** — chosen for privacy, reliability, and zero cost. The tradeoff is lower recall and English-centric detection; mitigated by manual review, custom terms, a leak check, and a patterns-only fallback.
- **Bundle the 66 MB q8 model in the repo** — chosen so the app is self-contained and the "no upload" claim is true. The tradeoff is repository size and first-load time; the `npm run verify:model` check and browser check verify it early.
- **Web Worker + chunking** — chosen so a long document does not freeze the UI and the model's 512-token limit does not silently truncate the tail. The tradeoff is more moving parts; the worker posts structured errors and the main thread falls back to patterns.
- **Session-only state** — chosen because persistence would weaken the promise. The tradeoff is that a refresh loses work; the UI warns.
- **Uncertainty to resolve during the build:** How well does the bundled DistilBERT model detect the names and organizations in the sample, and how long does the first browser inference take? The agreed investigation is the real-model smoke test (`npm run verify:model`) plus a browser scan of the sample, with the observed entities and timing recorded in `checklist.md > Revisions` / final notes. If recall on the sample is poor, the patterns-only banner stays prominent and the sample/manual-term flow is adjusted rather than hiding the limitation.
- **Open, non-blocking:** nickname/partial-name merging; whether to add a visible "protected copy" header; whether to offer a downloadable restore key. All are deferred from the POC; the session-only restore path is the current decision.
- **No deployment decision** — a local app plus the required video and public repo is sufficient. If the learner wants a live URL later, a static host can serve `dist/` with the bundled model; no server code is needed.

<!-- Self-review: every PRD behavior has a component and a file; the data model covers offsets, tokens,
     snapshots, leaks, and restore; the failures have fallbacks; the file tree is real and sized to
     the POC. No unresolved blocking questions. -->
