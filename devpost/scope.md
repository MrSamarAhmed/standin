---
doc: scope
status: approved
---

<!-- Approved under the learner's standing autonomous-execution brief (2026-10-26).
     Decision provenance is recorded in `prd.md > Product Decisions` and `spec.md > Decisions and Open Issues`.
     The learner can reopen any decision. -->

# StandIn

A local-first privacy desk that gives confidential documents a consistent cast of stand-ins, so solo professionals can use AI without handing over real names or identifiers — then restores the real details in the AI's answer.

## The Unique Kernel

**Reversible, consistent pseudonymization designed for AI collaboration.** One-way redactors make a document less useful: every name becomes a black bar, pronouns lose their referents, and the AI's answer arrives full of placeholders. StandIn replaces each sensitive entity with a stable token, keeps the cast in the browser, and uses the same cast to restore the AI's answer. The document stays coherent, and the answer comes back in the user's world. If the restore loop were removed, this would be another redactor — the loop is the kernel.

## Who It's For

**Maya, a solo HR and operations consultant.** She uses ChatGPT or Claude to draft sensitive client memos, investigation notes, and contract summaries, but she cannot paste employee names, salaries, bank details, or client identities into a chat. Today she either rewrites the document by hand, substitutes vague placeholders that make the AI's answer unusable, or takes a privacy risk. She needs a fast step between her document and the AI, not an enterprise data-loss-prevention suite.

## The Core Loop

Maya pastes a memo or loads the sample. StandIn scans it locally, highlights the people, organizations, locations, emails, phones, and identifiers it found, and builds a cast: **Alice Johnson → [PERSON_1]**, **Acme Health → [ORG_1]**. She reviews the cast, deselects anything she wants to keep, and adds any missed term. She creates the safe copy, runs the leak check, and copies it into her AI tool. When the AI answers, she pastes the answer into **Restore**; StandIn swaps the real details back in, locally. She comes back whenever another sensitive document needs the same treatment.

## Inspiration & Identity

An **editorial redaction desk**, not a neon AI dashboard. Warm paper, ink black, vermilion marks, and a playbill-like cast list. Fraunces display serif, Inter for the interface, an IBM Plex Mono face for tokens. Calm, careful, trustworthy, with a little theatrical pleasure in the "cast" metaphor. References: Stripe Press book design (https://stripe.press), classic redaction marks, theater playbills, and editorial layout systems. Avoid gradients, glassmorphism, purple AI defaults, and dashboard clutter.

## Why This Matters to the Learner

The learner asked for a narrow, high-value product with a clear target user, a complete workflow, and an outcome judges can understand in 30 seconds. StandIn is that product: privacy is the value, the reversible cast is the memorable idea, and the demo is concrete. The brief also required real AI, no fake integrations, no paid API dependency, and honest reporting of limitations.

## What "Working" Looks Like

Open StandIn, load the sample HR memo, and scan. The document shows highlighted names, organizations, locations, emails, phones, and account numbers. The cast is consistent across repeated mentions. Create the safe copy; it contains tokens such as `[PERSON_1]` and `[ORG_1]`, and the leak check reports zero remaining sensitive details. Copy it into an AI tool, then paste the AI's answer into Restore; every token is replaced with the correct real detail. The "oh, that's cool" beat is seeing the AI's polished answer come back with the real names in exactly the right places, while the mapping never left the browser.

## The POC Boundary

Plain-text paste and `.txt`/`.md` file input; local NER plus deterministic pattern scanning; a reviewable cast with accept/reject, manual additions, and stable tokens; tokenized safe copy; leak check; restore; a bundled fictional sample; copy and download; responsive, accessible UI. One browser tab, no account, no backend, no cloud storage.

## Later

PDF and image OCR; encrypted session save; a browser extension or clipboard companion; team-shared cast policies; multilingual models; an optional built-in AI assistant using a user-supplied key; a deployable hosted demo.

## Explicitly Cut

- **Accounts and authentication** — not needed to prove the privacy loop.
- **Cloud storage or sync** — would undermine the local-first promise.
- **PDF/image ingestion** — OCR is a separate failure surface; text proves the kernel.
- **Real-time collaboration** — not part of the solo workflow.
- **Automatic sending to an AI provider** — requires keys, trust, and a second privacy decision; the user chooses their AI tool.
- **Analytics** — the product's promise is that documents stay local.
- **Dark mode** — polish time is better spent on the core desk.
- **A downloadable mapping file** — a restore key is sensitive; the session-only restore tab is safer for the POC.
