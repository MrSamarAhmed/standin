---
doc: prd
status: approved
---

<!-- Approved under the learner's standing autonomous-execution brief (2026-10-26).
     Decision provenance is recorded under Product Decisions. The learner can reopen any decision. -->

# StandIn — Product Requirements

A local-first privacy desk that lets a solo professional use AI on a confidential document without handing over real names or identifiers. It builds a consistent cast of stand-ins, produces a safe copy, and restores the real details in the AI's answer.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey

1. **Arrive.** Maya opens StandIn and sees a calm, paper-like desk: the promise "Keep the names. Share the context.", a short explanation, a large paste area, a **Load sample memo** button, and a **Local only** badge.
2. **Bring a document.** She pastes a memo, drops a `.txt`/`.md` file, or loads the fictional sample. The interface shows a character count and enables **Scan locally** only when there is usable text.
3. **Scan.** She clicks **Scan locally**. On the first run, a progress panel says the private detector is loading, then that the document is being read. Nothing is uploaded. When it finishes, the document becomes a highlighted review surface.
4. **Review the cast.** The right-hand panel lists the cast — one row per unique sensitive entity, grouped by type, with its token and mention count. The document highlights every mention. A summary says how many sensitive details were found in how many places.
5. **Adjust.** She clicks a cast row to accept or reject it, clicks a mention to toggle it, adds a missed term such as a project codename, and sees the safe-copy preview update. She can clear all detections or rescan after editing the text.
6. **Create the safe copy.** She clicks **Create safe copy**. The app replaces every accepted entity with its stable token, preserving punctuation and whitespace. The safe copy opens in the next step, with the cast snapshot used to make it.
7. **Verify.** The leak check runs automatically and stamps the result: **0 leaks found**, or a list of occurrences that still need attention. Only a passing copy gets the "Ready to share" treatment; a failing copy still shows the leaks and a **Back to review** action.
8. **Share.** She clicks **Copy safe copy** and pastes it into her AI tool of choice. A note reminds her to keep the tab open for restore. She can also download the safe copy as a `.txt` file.
9. **Restore.** She opens **Restore**, pastes the AI's answer, and clicks **Restore real details**. StandIn replaces every known token with the original text from the safe-copy cast, highlights the restored values, and leaves unknown tokens intact with a warning.
10. **Finish.** She copies the restored answer. The cast remains available for another restore in the same session. **Start over** clears everything after a confirmation; refreshing the page also clears the session.

**Success:** a first-time user can complete steps 1–10 with the sample in under two minutes and see the real names return in the AI's answer, without an account, upload, or API key.

## Screens and Layout

StandIn is a single page with a three-step workspace. A slim header holds the wordmark, a **Local only** badge, **Load sample**, and **Start over**. A stepper beneath it shows **1 Prepare → 2 Safe copy → 3 Restore**. The header and stepper stay visible; the workspace changes.

**Prepare.**
- A two-column workspace on desktop: the left column is the document desk, the right is the cast panel. On narrow screens they stack, with the cast panel below the document.
- Empty state: a large editorial headline, a one-sentence explanation, two actions (**Paste a document** focus and **Load sample memo**), and a three-beat "how it works" strip (Scan → Cast → Restore).
- After text is present: a textarea with a document-like serif face, a character counter, a file input, and a primary **Scan locally** button.
- After scanning: the textarea is replaced by a read-only highlighted document. An **Edit text** button returns to the textarea and clears the scan. A small legend explains highlight colors. The cast panel shows a summary, grouped cast rows, and a custom-term input.
- The cast panel has a **Create safe copy** primary action, disabled until at least one accepted detection exists (or, when none are found, a secondary **Create copy without changes** path with a clear warning).

**Safe copy.**
- A two-column workspace: the safe copy on the left, a "cast sheet" and verification card on the right.
- The safe copy uses a readable document face with tokens rendered as mono pills. A toolbar offers **Copy safe copy**, **Download .txt**, and **Back to review**.
- The verification card shows a large pass/fail stamp, the leak list if any, and the counts: details replaced, mentions covered, and tokens in the cast. It explains that the check looks for structured patterns and known originals, not unknown names.

**Restore.**
- A two-column workspace: a paste area for the AI's answer on the left, a "how restore works" card and cast summary on the right.
- After restoring: the output replaces the input, with restored values highlighted in the same colors as the original. A toolbar offers **Copy restored answer** and **Restore another answer**.
- If no safe copy exists, the screen is an empty state with a **Prepare a document** action rather than a broken form.

**Footer.** A quiet line: "Runs in your browser. No uploads. No accounts. The cast lasts only for this tab." plus a **Privacy & limits** disclosure that opens an inline panel or native `<details>`.

## Look and Feel

- **Feeling:** a careful editor's desk with a hint of theater. Calm, tactile, trustworthy, a little bit delightful. Not a sci-fi dashboard.
- **Palette:** warm paper `#F6F1E8`; surface `#FFFCF6`; ink `#1D1A16`; muted ink `#6B6358`; line `#DED3C2`; vermilion `#C4442E`; highlighter amber `#F2D98D`; sage `#2F6B5E`; token green `#E7EFEA`. Color is used for meaning, not decoration.
- **Typography:** Fraunces (variable display serif) for headlines and the document body; Inter for controls and UI; IBM Plex Mono for tokens. Bundle the fonts locally so the app has no font CDN dependency. Use generous line height in documents and tighter, confident headings.
- **Layout:** paper cards with 1px warm-gray rules and soft shadows, never glass panels. A left-aligned editorial grid, wide margins on desktop, full-width stacking on mobile. Buttons are compact, with one primary vermilion action per step.
- **Motion:** a highlighter sweep when results appear, a stamp press for the leak result, and a gentle cross-fade between steps. 150–300ms; respect `prefers-reduced-motion`.
- **Copy tone:** plain, precise, lightly theatrical. "Cast," "safe copy," "restore," "mentions." Never overclaim: "finds likely sensitive details," not "guarantees anonymity."
- **Avoid:** purple gradients, glassmorphism, generic AI sparkle icons, dark-mode neon, dense dashboard chrome, mascots.

## Features and Behavior

### Starting a document

The user can paste text, choose a `.txt`/`.md` file, or load the fictional sample memo.

- Paste and file text populate one source-of-truth editor. Loading a file replaces the current text only after a confirmation if the editor has unsaved content.
- The character limit is 20,000 characters. The counter shows the count and turns vermilion near the limit. Over-limit input is rejected with a specific message; the app never silently truncates.
- Empty or whitespace-only input keeps **Scan locally** disabled and shows a short inline hint.
- The sample is clearly labelled as fictional in the editor and in a small "Sample" chip.
- Loading the sample or a new file clears any previous scan and cast; if a safe copy exists, the user is warned that the restore mapping will be replaced.

**Acceptance criteria**
- [ ] Empty input cannot start a scan; an inline message explains what is needed.
- [ ] A `.txt` or `.md` file loads its text; other file types show a specific error and leave the current text intact.
- [ ] Input beyond 20,000 characters is rejected visibly, not truncated.
- [ ] The sample loads with fictional names, `.example` emails, and 555 phone numbers, and is labelled as a sample.
- [ ] Replacing a document with an existing cast asks for confirmation before clearing the cast.

### Local scanning

The scan combines two local detectors:

1. **Named-entity recognition** — a bundled DistilBERT-NER ONNX model runs in a Web Worker. It finds people, organizations, locations, and miscellaneous named entities.
2. **Pattern scanning** — deterministic regular expressions find emails, phone numbers, government/account identifiers, money amounts, street addresses, and URLs. Expensive checks such as credit-card Luhn validation run locally.

The model runs only in the browser. The model files are served from the app's own origin; no document text or entity metadata is sent to Hugging Face or any other service. The first scan downloads/initializes the local model; a progress panel shows **Loading private detector** and then **Reading document**. Subsequent scans reuse the loaded detector.

Long documents are split into safe chunks at paragraph/sentence boundaries, scanned, and stitched back together with corrected offsets. Overlapping detections are merged, with a precise pattern winning over a broader model span.

If the model is unavailable, corrupt, or slower than the user is willing to wait for, the app falls back to **Patterns only** mode. A persistent, honest banner explains that names, organizations, and locations were not checked and that the user should review manually. A **Retry private detector** action is provided when the failure may be temporary.

**Acceptance criteria**
- [ ] With the bundled model available, scanning the sample produces at least one `PERSON`, one `ORG`, and one `LOCATION` detection, plus the structured pattern detections.
- [ ] With the model unavailable, scanning still produces email, phone, ID, money, address, and URL detections and shows the **Patterns only** banner.
- [ ] Scanning an empty document is impossible; scanning a document with no matches shows a no-detections state.
- [ ] Running the same scan twice does not duplicate detections or change cast tokens.
- [ ] The app makes no network request containing document text. (Verified by inspecting the Network panel during a scan; the model assets are same-origin static files.)
- [ ] A 10,000-character document is split and scanned without a runtime error or a silently truncated tail.

### Reviewing and casting

The prepare workspace turns detections into a **cast**. Each unique entity gets one type, one stable token, and a mention count. Repeated mentions share the same token. The cast is ordered by first appearance, grouped by type in the panel.

- Clicking a cast row toggles acceptance. Rejected entities remain highlighted in a muted "kept" style and are not replaced.
- Clicking a highlight toggles that entity's acceptance (all mentions, because the cast is entity-level).
- The cast row shows the original text, the token, the type icon/label, the source (model or pattern), and the mention count. A tooltip or disclosure shows all mention locations.
- A custom-term input lets the user add a name, project, or client term that the detectors missed. Adding it finds all occurrences, respects word boundaries for word-like terms, and adds a `CUSTOM` cast member. Duplicate terms are rejected with a clear message. Empty or whitespace-only terms are rejected.
- A **Select all / none** control and a per-type count help with large documents.
- Editing the source text clears the scan and the cast after confirmation; it never leaves stale offsets or highlights.

**Acceptance criteria**
- [ ] The sample produces a cast with a consistent token for each unique person/organization/location and at least one each of email, phone, ID, and money.
- [ ] Repeated mentions of the same entity display the same token and a mention count greater than one.
- [ ] Toggling a cast member changes its highlight state and the "selected" count before the safe copy is created.
- [ ] Adding "Project Lantern" detects all case-insensitive occurrences and assigns one `[CUSTOM_n]` token.
- [ ] Adding a duplicate custom term or an empty term produces a specific inline error.
- [ ] Editing the source invalidates the cast and explains that a rescan is required.

### Create the safe copy

The safe copy is the document with every accepted entity replaced by its token. Replacement is entity-level, not just detection-level: every exact occurrence of an accepted entity is replaced, so a second mention is not accidentally left behind. Replacements preserve surrounding punctuation, whitespace, and line breaks.

The app snapshots the cast used for the safe copy. If the user goes back and changes the cast, the existing safe copy is marked **Out of date**; the user must update it before copying again. Restore always uses the snapshot that produced the current safe copy, so old tokens remain meaningful.

If no sensitive details are found, the user can still create a copy without changes only after acknowledging a warning that no automatic protection was applied.

**Acceptance criteria**
- [ ] Every accepted entity's exact occurrences are replaced; no accepted original text remains in the safe copy.
- [ ] The safe copy preserves line breaks and punctuation and is readable.
- [ ] Changing an acceptance after creating a safe copy marks it out of date and prevents a misleading "ready to share" state.
- [ ] The cast snapshot is the only mapping used by the restore step.
- [ ] The no-detections path requires an explicit acknowledgement and labels the copy as unprotected.

### Leak check

After creating the safe copy, the app re-examines it locally:

- it runs the structured-pattern scanner again;
- it checks for each active cast member's original text, case-insensitive for word-like entities and exact for structured values;
- it checks that every token in the copy belongs to the cast snapshot and is well formed.

A passing result shows **0 leaks found** with the number of details and mentions protected. A failing result lists each remaining occurrence with its type and a **Back to review** action; the copy button remains available only with an explicit "Copy anyway" acknowledgement. The check is a safety net, not a guarantee: the UI says it cannot catch an unknown name that the detectors missed.

**Acceptance criteria**
- [ ] A correct safe copy passes with `0 leaks found`.
- [ ] Deliberately leaving a known original in the copy makes the check fail and names the leak.
- [ ] A malformed or orphan token is reported separately from a text leak.
- [ ] A failing copy cannot be copied without an explicit acknowledgement.
- [ ] The UI clearly states the check's limits.

### Restore the AI's answer

The restore step accepts the text the user got back from their AI tool. It replaces tokens of the form `[TYPE_n]` with the original values from the safe-copy snapshot. It tolerates common variations the AI may introduce: lowercase, spaces instead of underscores, and hyphens. It does not call an AI, upload the answer, or persist the mapping.

The output highlights restored values. A summary reports how many tokens were restored and how many were unknown. Unknown tokens remain visible and are listed so the user can decide whether the AI invented them or used an old copy. If the answer contains no recognizable tokens, the app explains that the AI may have removed them and that there is nothing to restore, rather than pretending success.

**Acceptance criteria**
- [ ] A pasted answer containing `[PERSON_1]` and `[ORG_1]` restores the exact original names in the correct places.
- [ ] Case/spacing variants such as `[person 1]` and `[ORG-1]` restore correctly.
- [ ] An unknown token such as `[PERSON_9]` is left intact, flagged, and counted; it is never replaced with a guessed value.
- [ ] An answer with no tokens shows a helpful no-tokens state.
- [ ] The restore action works with no network connection.

### Privacy and session behavior

StandIn is a one-tab, local-first tool. The document, cast, safe copy, and AI answer live in React memory only. There is no account, backend, analytics, telemetry, cloud storage, or `localStorage`/`sessionStorage` copy of document content. Static assets (fonts, model, sample) are served from the app origin.

A `beforeunload` warning appears when there is unsaved work. **Start over** requires confirmation and clears the document, cast, safe copy, and restore input. Refreshing the tab clears the session. The privacy disclosure explains the model source, the session-only behavior, and the fact that the user's AI tool is a separate service with its own privacy terms.

**Acceptance criteria**
- [ ] After a scan, refreshing the page returns to a clean empty state; no document content is recoverable from browser storage.
- [ ] `localStorage` and `sessionStorage` contain no document, cast, safe-copy, or AI-answer text.
- [ ] A `beforeunload` warning appears when the workspace contains text.
- [ ] **Start over** clears all state after confirmation.
- [ ] The privacy disclosure is reachable from every step and is readable without JavaScript-only interactions.

## States and Boundaries

- **First use / empty** — the editorial intro, a sample button, a paste area, and the privacy promise. No cast or restore form is shown as if it had data.
- **Model loading** — a progress panel with a concrete status, not an indefinite spinner. The rest of the page remains legible; the user can cancel by editing or starting over.
- **Scanning** — the scan button enters a busy state, the document is not editable, and a live status names the phase. A second click cannot start a parallel scan.
- **No detections** — a calm message that no obvious sensitive details were found, a prompt to add a term manually, and a warning that the leak check cannot find unknown names. No fake green "safe" claim.
- **Patterns only** — a persistent banner names the reduced coverage and offers a retry. The app never labels model-free results as full coverage.
- **Model error** — a specific message, a retry, and a clear path to patterns-only mode. The error does not erase the user's document.
- **File error** — wrong type, unreadable file, or too-large text gets a specific inline message; the current document is preserved.
- **Clipboard failure** — a toast explains the failure and selects the text so the user can copy manually.
- **Restore with no cast** — an empty state that points back to Prepare; no disabled mystery form.
- **Unknown token** — left intact, highlighted, counted, and listed with a warning.
- **Out-of-date safe copy** — a visible badge and a required update before copying; restore uses the snapshot, not the edited cast.
- **Leak detected** — a failing stamp, a list of leaks, and an explicit "copy anyway" acknowledgement; never a misleading success stamp.
- **Persistence boundary** — session memory only; a refresh or **Start over** removes everything. The model and fonts are static assets, not user data.
- **Permission boundary** — the user explicitly clicks copy/download/restore; the app never sends or shares content on its own.

## Product Decisions

- **Reversible tokenization instead of one-way redaction** — delegated by the learner's brief to select the strongest kernel; a one-way bar loses referential meaning and makes the AI's answer harder to use. The tradeoff is a mapping that must be kept for the session and handled carefully.
- **Local NER plus deterministic patterns, no cloud LLM** — chosen to keep the document local, avoid API keys and variable costs, and make the demo reliable offline. The tradeoff is lower recall than a large language model and English-centric NER; the review step and leak check compensate, and the UI states the limit.
- **Bundled 66MB quantized DistilBERT-NER model** — chosen so the app is self-contained and privacy claims are true. The tradeoff is repository size and first-load initialization time; a patterns-only fallback protects the basic workflow.
- **Text-only input for the POC** — chosen to avoid OCR failure modes and keep the kernel visible. PDF/image ingestion is deferred.
- **Session-only memory, no persistence** — chosen because storing confidential documents in browser storage would undercut the promise. The tradeoff is that a refresh loses work; the `beforeunload` warning and **Start over** confirmation make that explicit.
- **Single-page, no account** — chosen to keep the proof of concept focused on the privacy loop. Accounts, sync, and collaboration are out.
- **Entity-level cast rather than mention-by-mention redaction** — chosen so repeated mentions stay coherent and the token mapping stays simple. The tradeoff is less granular control; the review step shows mention counts and lets the user reject a whole entity.
- **Sample memo as a first-class entry point** — chosen to make the demo and first-run experience instant without asking the user to find a sensitive document.
- **Fast build mode** — the learner delegated execution and asked for a working, judge-ready result; verification and browser checks still happen at every slice.

## What We're Building

- A responsive, polished single-page app with Prepare, Safe copy, and Restore steps.
- Local pattern detection for emails, phones, SSN/account/IBAN/card identifiers, money amounts, street addresses, and URLs, with Luhn validation for card-like numbers.
- Local NER for people, organizations, locations, and miscellaneous named entities, with model progress, a Web Worker, a retry, and a patterns-only fallback.
- Chunked scanning for longer documents with corrected offsets and deduplication.
- A cast panel with entity-level acceptance, mention counts, type grouping, custom terms, and stable tokens.
- A tokenized safe copy with an explicit cast snapshot, out-of-date protection, copy/download, and a leak check.
- A restore step with token normalization, unknown-token warnings, restored-value highlighting, and copy.
- A fictional sample memo and a clear privacy/limits disclosure.
- Empty, loading, error, no-detection, leak, and unknown-token states.
- Automated tests for the pure logic and the core journey UI; a real local-model smoke test; browser-based manual verification.
- A public-ready README, LICENSE, run instructions, screenshots, and the planning/app-map artifacts.

## Deferred From the POC

- **PDF and image ingestion** — needs OCR, layout reconstruction, and a second accuracy story; text proves the reversible-cast kernel.
- **Encrypted session save / restore key download** — would require key management and a careful security review; session-only is the safer POC.
- **Browser extension / clipboard companion** — a natural distribution path, but a separate integration and permission surface.
- **Team-shared cast policies and audit logs** — enterprise features that do not help the solo-user demo.
- **Multilingual NER** — the chosen model is English; another model is a later enhancement.
- **Built-in AI assistant** — would require provider keys and put a third-party call in the critical path; the user's own AI tool is the current integration.
- **Deployment** — optional for submission; the video and public repo are required. A static-host deployment can be added after the core is verified.

## Possible Later Enhancements

- A browser extension that opens StandIn from any text field and injects the safe copy.
- Encrypted local vaults for recurring clients and casts.
- Custom regex/policy rules for a team, with export/import.
- PDF redaction with true visual black bars, plus OCR confidence review.
- A "cast consistency" merge UI for nicknames and partial names.
- A local, small language model for a built-in rewrite step, with the same cast applied before inference and restoration after.

## Non-Goals

- **Guaranteed anonymity or compliance certification** — the detectors are probabilistic and pattern-based; the product is a privacy aid with human review, not a compliance guarantee.
- **Legal, medical, or financial advice** — the app protects text; it does not interpret it.
- **Storing, transmitting, or backing up documents** — local-first is the promise.
- **Redacting images, handwriting, or scanned PDFs** — text only for this POC.
- **Replacing the user's AI tool** — StandIn prepares and restores; it does not generate the answer.
- **Supporting every language or naming convention** — English NER is the tested path; the UI says so.

## Open Questions

- **NER recall and browser performance** — resolve early in the build with the real model on the sample and a longer document. If the model is too slow or inaccurate, keep the patterns-only path prominent rather than hiding the limitation.
- **Should the cast panel support merging nicknames?** — not required for the POC; record as later if the sample exposes a confusing split (for example, "Priya" and "Priya Raman").
- **Should the safe copy include a visible header/footer warning?** — a small "Protected copy made with StandIn" line could alter the document. Keep the copy clean; put the warning in the surrounding UI. Revisit only if the demo shows confusion.
- **Is a `.txt` download enough?** — yes for the POC; PDF/DOCX export is deferred.

<!-- Readiness check: the core journey, screens, visual direction, behaviors, acceptance criteria,
     empty/error states, and now/deferred split are specified. The only unresolved product
     questions are non-blocking and recorded above. -->
