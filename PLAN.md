# PLAN: Sirion Inbox-to-Intake prototype

Source of truth: `docs/Sirion_Inbox-to-Intake_product_concept_note.docx` (the note) and `docs/ISB_Assignment_Sirion.pdf` (the brief). Build rules: `docs/BUILD_PROMPT.md`. Conflicts and gap-filling choices: `DECISIONS.md`.

## 1. Information architecture

One Next.js app (static export). Persistent left rail on desktop, bottom tab bar on mobile.

| # | Route | Section | Brief item | Primary action |
|---|---|---|---|---|
| 1 | `/` | Start here | (entry) | Watch the 2-minute walkthrough |
| 2 | `/why/` | Why intake | 1. Why this stage | See the problem |
| 3 | `/problem/` | Problem | 3. The problem | See who is involved |
| 4 | `/stakeholders/` | Stakeholders | 2. Stakeholder map | Click a person or a conflict line |
| 5 | `/assumptions/` | Assumptions | "state assumptions" | Open the live product |
| 6 | `/product/` | Live product | 4. Working prototype | Add to Sirion (then Submit) |
| 7 | `/metrics/` | Metrics | 5. Success metrics | See what's next |
| 8 | `/next/` | What's next | (depth) | Read the sources |
| 9 | `/sources/` | Sources | (evidence) | none |

Every narrative section fits 1280 x 800 without page scroll. Depth sits behind tabs and "Details" drawers.

## 2. Live product screens (inside `/product/`, switched by app state)

| Screen | Who | Primary action |
|---|---|---|
| Mock inbox + Sirion sidebar | Procurement owner | Add to Sirion, then Review (N to resolve) or Submit request |
| Sirion deal review (reading pane) | Owner | Confirm evidence, then Submit request |
| Submit confirm dialog | Owner | Submit request (deliberate friction) |
| Receipt (mocked) | Owner | Open Legal view |
| Legal view (+ Finance reference pack tab) | Legal intake reviewer, Finance | Start drafting (or Ask procurement) |
| Contract record, one year later (mocked) | Owner, Finance | Open the Deal trail |

Plus: deal switcher (main deal + 8 exploration deals), "How it decides" drawer (autonomy ladder, five checks, schema, planted wrong outputs, in-production note), "Design notes" drawer.

## 3. Data model (`src/lib/types.ts`)

- `Message`: id, threadId, kind (`email` | `pdf`), from {name, email}, to, date, subject, body, attachmentIds, filename (pdf), readable.
- `Thread`: id, subject, messageIds, folder.
- `Deal`: id, title, category, supplier {name, legalEntity, domain}, rival?, requester, owner, openMessageId, threads, preAdded (items a requester already added), repository records + coverage note, confidential tokens (rival names, internal limits), routing inputs.
- `AddedItem`: messageId, addedBy, addedAt, via (`this-email` | `thread` | `attachment` | `@`), removed?.
- Owner decisions per term: `confirmed`, `resolution` (picked value | open with reason and owner | owner-entered off-email value).
- Core field confirmations and "typed by hand" flags.

## 4. Example-output schema (`src/lib/schema.ts`, Zod)

`data/ai-examples/<deal-id>.json` holds what a model would return for that deal:
- `dealMatch.suggestions[]`: dealId, confidence, reasons[] {type: supplier_domain | quote_number | people | product, detail}.
- `coreFields[]`: key, value, evidence[] {messageId, quote}.
- `terms[]`: key, label, group, fieldType, claimedStatus, steps[] {role: offer | counter | condition | resolution | acceptance | withdrawal | statement, party: supplier | buyer, value, messageId, quote}, plantedFlaw? (marks deliberately wrong output).
- `contractType`: suggestion, reason, evidence.
- `chaseDrafts[]`: termKey, to, subject, body, sourceMessageIds.
- `flags[]`: type `suspicious_instruction`, messageId, quote, note.
- `entityMentions[]`: messageId, quote, entity.

Validated at build time (`npm run validate:examples`) and in Vitest.

## 5. Live checks (`src/lib/checks.ts`, `src/lib/derive.ts`)

Run in the browser on every change of the added material:
1. Citation exists word for word in the cited added message (whitespace-normalised).
2. Evidence bundle: offer, every condition resolved later, both sides on the final value, an explicit acceptance.
3. No contradiction: no un-superseded statement of a different value in the added material.
4. Value parses to the field type; supplier-side evidence comes from the supplier's domain; entity mentions match the deal's legal entity.
5. Owner confirms (UI).

Fail any of 1 to 4: the term abstains and shows the reason ("Held back: ..."). Steps from messages not added are dropped before checks run, so the reviewer's ticks drive the result.

Other code-owned decisions: deal-suggestion threshold (domain or quote number must actually match), domain-mismatch warning, duplicate skip by message ID, route (Legal-owned rules, never read from supplier text), chase-draft scoping (supplier's own thread only, confidential tokens blocked), submit gate, idempotent submit, typed-by-hand counter.

## 6. Walkthrough (`src/components/walkthrough/walkthrough.ts`)

12 chapters, about 120 s at 1x. Each step: chapter, caption, target selector (`[data-tour=...]`), action (calls the same store actions the UI uses), duration. Seeking replays prior actions instantly from a reset store, so any chapter replays on its own. Cursor glides (ease-in-out), spotlight (Midnight 60% + 2 px Teal ring + glow), caption bar, chapter list, scrubber, Space / arrows / restart / 1x-1.5x / Take over. Reduced motion: no cursor travel. MP4 fallback recorded by Playwright (`npm run record:walkthrough`).

## 7. Build order (one commit each)

1. Data and types. 2. Example outputs, schema, checks. 3. Live flow. 4. Narrative. 5. Walkthrough. 6. Tests. 7. Polish + audits. 8. Deploy.
