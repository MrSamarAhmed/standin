---
doc: checklist
status: approved
---

<!-- Approved under the learner's standing autonomous-execution brief (2026-10-26).
     Build mode: fast, because the learner delegated execution and asked for a working,
     judge-ready result. Verification and browser checks are still mandatory per slice.
     Slice checkboxes record implementation and mechanical verification. The Commit
     messages are the intended checkpoint messages. The repository is public at
     https://github.com/MrSamarAhmed/standin under the learner's push authorization;
     learner checkpoints, final review, and the learning activity remain unchecked. -->

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A pasted document becomes a highlighted, reviewable cast**
  Becomes usable: A running app where pasting text or loading the sample produces local pattern detections, a highlighted document, and a cast list with consistent tokens. No AI model and no safe copy yet.
  Why now: Proves the first half of the kernel end to end — real input, real detection, visible cast — and creates the scaffold every later slice lands in.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Starting a document`, `prd.md > Local scanning`, `prd.md > Reviewing and casting`
  Spec ref: `spec.md > Components`, `spec.md > File Structure`, `spec.md > Data Model`
  Build: Scaffold Vite + React + TypeScript, add the paper/editorial design tokens and local fonts, create the shared types, the pattern detectors (email, phone, ID/account/IBAN/card with Luhn, money, address, URL), the chunk-free scan path, deduplication, cast building, the sample memo, the editor, the highlighted document, the cast panel, and the worker-ready architecture. Add unit tests for patterns and cast building.
  Verify (mechanical): `npm run typecheck`, `npm test`, start the dev server, load the sample, and confirm the highlighted document and cast render with a consistent token per entity. Browser check with a screenshot.
  Learner check: Open the app, load the sample, and say whether the highlighted document and cast list make the privacy idea clear.
  Commit: `Add pattern scan, highlighted document, and cast`

- [x] **2. The cast produces a safe copy, verifies it, and restores an answer**
  Becomes usable: The complete reversible loop with pattern detections: create a tokenized safe copy, run a leak check, copy it, paste a text containing the tokens, and get the real details back.
  Why now: This is the unique kernel. The full loop must work before adding the AI detector; otherwise the product is a collection of disconnected features.
  PRD ref: `prd.md > Create the safe copy`, `prd.md > Leak check`, `prd.md > Restore the AI's answer`, `prd.md > The Core Journey` (steps 6–10)
  Spec ref: `spec.md > Components` (`SafeCopyView`, `RestoreView`), `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add the safe-copy snapshot, longest-first combined-regex tokenization for all accepted entities, copy/download, the leak check (patterns, known originals, orphan tokens), the out-of-date state, the copy-anyway acknowledgement, the restore parser with case/spacing normalization and unknown-token reporting, and the three-step navigation. Add unit tests for tokenization, leak checking, and restore.
  Verify (mechanical): `npm test`, `npm run typecheck`, then in the browser: create the sample safe copy, confirm 0 leaks, copy it, paste a fixture containing the tokens into Restore, confirm the originals return and unknown tokens are flagged. Screenshot each state.
  Learner check: Try the full loop with the sample and a short answer containing the tokens. Does the restored text prove the idea in one screen?
  Commit: `Add safe copy, leak check, and restore loop`

- [x] **3. The local AI finds names, organizations, and locations**
  Becomes usable: A real local NER model runs in a Web Worker, detects people/orgs/locations in the sample, merges them with the pattern detections, shows model progress, and falls back to patterns-only with an honest banner when it cannot load.
  Why now: This is the largest technical risk and the product's AI claim. Prove it before the polish so the design work rests on real behavior.
  PRD ref: `prd.md > Local scanning`, `prd.md > States and Boundaries` (model loading, patterns only, model error)
  Spec ref: `spec.md > Components` (`ner.worker.ts`), `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`, `spec.md > Decisions and Open Issues`
  Build: Download and bundle the q8 DistilBERT-NER model with attribution; add the Transformers.js worker, local-only model configuration, ORT WASM copy script, progress reporting, chunking with overlap, offset correction, entity-label mapping, regex/model overlap resolution, retry, and patterns-only fallback. Add the Node real-model smoke script and chunk/merge tests.
  Verify (mechanical): `npm run verify:model` prints real entities from the bundled model; `npm test`; `npm run typecheck`; in the browser, scan the sample and confirm PERSON/ORG/LOCATION detections appear, then block the model assets and confirm the patterns-only banner and a successful scan. Record the model timing and entities in the checklist.
  Learner check: Scan the sample. Do the names and organizations it finds feel credible, and does the fallback feel honest rather than hidden?
  Commit: `Add local NER worker with patterns-only fallback`

- [x] **4. The reviewer controls the cast and the edge cases are handled**
  Becomes usable: A user can accept/reject cast members, add missed terms, see mention counts and sources, rescan after editing, load files, handle empty/no-detection/too-long inputs, and is warned when a safe copy is out of date.
  Why now: The privacy guarantee depends on the human review step. The cast is not trustworthy until the user can correct it, and the failure states need to be real before visual polish.
  PRD ref: `prd.md > Reviewing and casting`, `prd.md > Starting a document`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components` (`DocumentEditor`, `CastPanel`, `CastRow`), `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add cast-level accept/reject and select-all/none, custom-term detection with word boundaries, mention disclosure/counts, source labels, edit/rescan invalidation, file input for `.txt`/`.md`, character limit and validation, no-detection and too-long states, replace/reset confirmations, and the stale safe-copy rule. Add tests for custom terms, toggling, validation, and stale snapshots.
  Verify (mechanical): `npm test`, `npm run typecheck`, and a browser pass through each edge case: empty, wrong file type, over-limit, no detections, custom term, rejected entity, edit/rescan, stale safe copy. Screenshots or a written browser-check note for each.
  Learner check: Try to break the review: reject a name, add a term, edit the text, and see whether the app stays coherent and tells you what happened.
  Commit: `Add cast review controls and edge-case handling`

- [x] **5. The desk is polished, responsive, accessible, and honest**
  Becomes usable: The finished visual experience: editorial paper desk, local fonts, the three-step layout, highlighter and stamp motion, copy/download, privacy disclosure, beforeunload warning, mobile stacking, keyboard focus, reduced-motion support, and consistent empty/loading/error states.
  Why now: Design and Presentation are half the judging criteria, and the UI is the product's trust surface. Polish after the behavior is real so it is not a veneer over broken logic.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Privacy and session behavior`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components` (`AppShell`, `PrivacyDisclosure`)
  Build: Apply the full visual system, responsive breakpoints, accessible semantics and focus states, live regions, reduced motion, the privacy disclosure, the beforeunload warning, the custom confirmation dialog, toast/copy fallback, favicon, and final copy review for tone and truthfulness. Do not add new product behavior.
  Verify (mechanical): `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`; browser checks at desktop and mobile widths; keyboard tab-through; reduced-motion check; confirm no document text in storage; capture the final screenshots.
  Learner check: Open the app at desktop and phone widths, use only the keyboard for one pass, and say whether it feels like a finished product rather than a demo.
  Commit: `Polish responsive editorial UI and privacy states`

- [x] **6. Verify, document, and package the proof of concept**
  Becomes usable: A submission-ready local project: full test suite passing, real-model smoke test recorded, production build verified, README with setup and limits, MIT license, model attribution, screenshots, app map, and an honest submission checklist for the human-only steps.
  Why now: The last slice is evidence, not features. It closes the loop with actual commands and output, without inventing results.
  PRD ref: `prd.md > What We're Building`, `prd.md > Non-Goals`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > External Services and Dependencies`
  Build: Add the README (facts, setup, architecture, model attribution, privacy limits, test commands), LICENSE, model license/attribution files, the final screenshots, the app map, and the submission readiness checklist. Run the full suite and the production build from a clean dependency state. Remove dead code, debug output, and unused dependencies.
  Verify (mechanical): `npm test`, `npm run typecheck`, `npm run build`, `npm run verify:model`, `npm run preview` with a final sample scan; check the repo diff for secrets/private files; confirm `devpost/scope.md`, `prd.md`, `spec.md`, and `checklist.md` are present and public-safe.
  Learner check: Follow the README from a clean shell, load the sample, and confirm the documented commands work. Then record the demo video and write your own submission copy.
  Commit: `Add verification, README, license, and submission package`

## Verification Log

Environment: macOS arm64; Node 24.22.1 and npm 11.19.1 from the local `.tools` install; Chrome 155.0.8059.85 headless driven through CDP; production build served at `127.0.0.1:4173`.

- **Suite:** `npm test` — 8 files, **59 tests passed**. `npm run typecheck` clean. `npm run build` succeeded. Re-run after the final copy edits.
- **Clean setup:** a copy without `node_modules/` or `dist/` passed `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run verify:model`.
- **Real model:** `npm run verify:model` loaded the bundled q8 ONNX model offline and found `Maya Chen` (0.998), `Daniel Okafor` (0.998), `Horizon Labs` (0.986), and `Meridian` (0.961) in 124 ms; **PASS**.
- **Full journey:** on the production build, sample → scan → review → safe copy → restore produced **19 cast rows**, **28 highlighted mentions**, **29 replacements**, a **1,068-character** safe copy, **0 leaks**, and no page exceptions. The known-residual list (names, organizations, locations, email, phone, account, card, `MRD-441`, URL) was empty. Restore returned `Maya Chen`, `Horizon Labs`, `daniel.okafor@horizonlabs.example`, and `$48,500`; `[PERSON_9]` remained visible and was reported as unknown.
- **Fallback and recovery:** in an isolated copy with `model_quantized.onnx` removed, the review screen showed the **Patterns-only** banner and **11** pattern-only cast rows. After restoring the file, **Retry detector** recovered to **19** rows with no banner or page errors.
- **Responsive and accessible:** 1440×1000 and 390×844 had no horizontal overflow or page errors; 8 keyboard Tab stops showed visible focus outlines; `prefers-reduced-motion: reduce` set animations and transitions to 0.01 ms; `localStorage`, `sessionStorage`, and IndexedDB were empty after a real scan; a `beforeunload` event was prevented while work existed.
- **Browser coverage gap:** the integration suite covers wrong file type, over-limit, no-detection acknowledgement, stale safe copy, cancel, and fallback. A separate manual click-through of every one of those cases in a browser was not performed; the populated journey, model fallback, and responsive/accessibility checks were exercised in Chrome.
- **Repo audit:** no `.env` files, credentials, or API keys found. `.gitignore` excludes `.env*`, `devpost/learner-profile.md`, `node_modules/`, `dist/`, `public/ort/`, and agent tooling. The repository is public at https://github.com/MrSamarAhmed/standin on `main`; the working tree is clean, the initial push was not forced, and GitHub reports the MIT license. The private learner profile returns HTTP 404 from the public repository. The commit author is the system-derived local identity `AL-FATIH <al-fatih@AL-FATIHs-MacBook-Pro.local>`. GitHub warns that the 62.73 MB model exceeds its 50 MB recommendation but remains below the 100 MB hard limit; no Git LFS is used.

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (full pattern-only loop), with browser evidence recorded
- [ ] Final kick-the-tires exploration and feedback completed — after slice 6, by the learner

The agent browser checks above are not a substitute for either checkpoint. Both remain open until the learner tries the app and reports back.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

<!-- The agent can complete mechanical verification and a browser-driven exploration, but it
     cannot substitute for the learner's own hands-on report. The checkpoints and final review
     remain open until the learner confirms. -->

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: `devpost/app-map.html` was generated from the final source after the last fixes and browser-checked at 1440 and 390 widths: 6 sections, 3 reference stops, 8 change pointers, no scripts, no external links, no page errors, and no horizontal overflow. It includes the project-grounded practice: turn the visible safe-copy promise into a check, and encode a real miss (`MRD-441`) as a regression test before fixing the shared rule. The map is linked in the handoff; open the file directly in a browser.
Route and stops: three reference stops (scan button → scan hook and detection → safe copy/restore). This is a reference route; it was not toured with the learner.
Edit outcome: not offered or completed; no learner edit was made.
Reflection: not offered; the learning wrap-up remains open.
Activity mode: static reference map only; no guided or focused activity was completed.

## Revisions

- 2026-10-26 — **No repository commits were created during the build slices.** The workspace was not a git repository when the build started; the Skill Pack requires learner agreement for `git init`, and publishing requires explicit authorization. Slice checkboxes therefore record implementation and mechanical verification only. The `Commit:` fields remain the intended checkpoint messages.
- 2026-10-26 — **Sample safe copy leaked `MRD-441`.** A browser residual check found the reference code still visible. Added a standalone uppercase reference-code rule to `RULES` in `src/lib/patterns.ts` and a regression test, `finds standalone uppercase reference codes`, in `src/lib/patterns.test.ts`. Re-ran the suite and the full journey: 0 known residuals.
- 2026-10-26 — **28 highlighted mentions but 29 replacements.** `Meridian` repeats exactly outside highlighted spans. Kept the safer all-exact-repeats behavior and clarified the cast instruction and row label (“detected mention”) instead of changing the counts.
- 2026-10-26 — **Model failure was tested, not assumed.** An isolated build with the model file removed showed the Patterns-only banner and 11 pattern-only rows; restoring the file and clicking Retry recovered 19 rows. No source change was needed.
- 2026-10-26 — **App map commit hash recorded.** The map was generated before the first commit; its header and snapshot note now cite `eac1b2f` as the source-code commit. This docs update is committed separately.
- 2026-10-26 — **Final packaging added.** README, MIT license, model attribution, refreshed screenshots, and a clean-copy `npm ci` verification were completed after the last UI copy edits.
- 2026-10-26 — **Local repository prepared.** Initialized `main` locally and committed 76 reviewed files as `eac1b2f` (“Build StandIn proof-of-concept privacy desk”) under the learner's final-readiness instruction. At that point no remote existed, nothing had been pushed, and no public repository had been created.
- 2026-10-26 — **Repository published.** The learner authorized the push. Created the public repository https://github.com/MrSamarAhmed/standin and pushed `main` without force; GitHub reports the MIT license and does not serve the private learner profile. History was not rewritten, so the commit author remains the machine-local identity. No demo video or Devpost submission exists.

