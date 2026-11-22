# Sirion Inbox-to-Intake

A clickable prototype for the ISB x Sirion APM case. One scenario: Manraj, a procurement contract owner, agreed a deal with Brightline over email. A Sirion add-in in Outlook adds the deal's emails and quote to deal DL-1042 in one click, and Sirion builds the intake request from them, with every term cited. The story ends when the intake request is created; terms not agreed in email are flagged for Legal, never shown as agreed.

For now the site opens straight into the prototype, full screen (DECISIONS C7). The brief's five sections (Why this stage, Stakeholders, Problem, Prototype, Metrics) stay in code and open by URL: /why/, /stakeholders/, /problem/, /product/, /metrics/. In the prototype, a pulsing marker points at the next click, the add-in says why an email belongs to the deal, every value on the Sirion request can be edited (and the edit is logged), and Submit says what blocks it. On a phone it shows Outlook mobile and Sirion mobile layouts. The thinking behind it is a full page at /about/ (DECISIONS C12).

- Live site: https://sirion-inbox-to-intake.vercel.app
- Walkthrough recording: [`public/walkthrough.mp4`](public/walkthrough.mp4), also served at `/walkthrough.mp4`
- Plan: [`PLAN.md`](PLAN.md). Decisions and conflicts: [`DECISIONS.md`](DECISIONS.md). Build prompt and sources: [`docs/`](docs/)

All data is synthetic. Halden Group, its suppliers and people are fictional and use `.example` domains.

## Run it

Node 20 or later. No environment variables.

```bash
npm install
npm run dev               # http://localhost:3000
npm run build             # validates the example AI outputs, then a static export to out/
npm test                  # Vitest: checks, status rules, submit gate, idempotency, guardrails, walkthrough
npm run test:e2e          # Playwright against the static export (serves out/ on port 3200)
npm run record:walkthrough  # needs a build and ffmpeg; writes public/walkthrough.mp4
```

## What is real, and what is not

Every screen labels its parts with one of three chips.

| Chip | What it means | Where |
|---|---|---|
| **Example AI output** | Hand-authored JSON in `data/ai-examples/`, in the exact shape a model would return (schema in `src/lib/schema.ts`, validated with Zod at build). No model is called. | Terms, statuses, citations, chase drafts, contract type suggestion, deal suggestions |
| **Live check** | Real code that runs in your browser on those outputs and can overrule them. | Citation match, evidence bundle, contradiction check, value parse and party check, owner confirm, routing, rival filter, injection scan, submit gate |
| **Mocked** | Stands in for a system we do not have. | Mail client, Sirion intake endpoint (idempotent), repository lookup |

Three example outputs are deliberately wrong (a paraphrased citation, a one-sided acceptance, a chase draft that names a rival quote), plus a claimed acceptance that a quote contradicts. The live checks catch all of them. The Metrics page runs the guardrail suite live: **5 of 5 wrong outputs caught, 10 of 10 cases pass.**

## Architecture

```
data/                 the main deal, 8 more deals used only as test fixtures, people, example AI outputs (JSON)
src/lib/
  schema.ts           Zod contract for model output
  checks.ts           live checks: citation, bundle, contradiction, parse, routing, chase, injection
  derive.ts           deal view: statuses, core fields, coverage, blockers, payload
  store.ts            one external store (useSyncExternalStore); UI and walkthrough call the same actions
  submit.ts           mock Sirion endpoint with idempotency keys
  guardrail-suite.ts  planted wrong outputs and risky inputs, run in Vitest and in the browser
src/components/
  product/            mail client, Sirion add-in, Sirion request screen, Legal view, coach marks, drawers
  narrative/          the brief sections and the notes drawer
  walkthrough/        the film: script (walkthrough.ts) and player (Film.tsx)
src/app/              one route per section, static export
```

The model's job is to extract and classify. Code decides what is shown as agreed. A term is "Accepted by both" only when the cited text exists word for word, the offer and acceptance come from opposite sides, conditions are resolved, nothing later contradicts it, and the owner confirms. Anything else is held back or goes to Legal as open, with a reason and an owner.

## Tests

- **Vitest, 37 tests** (`tests/unit/`): citation verifier, value parsing, routing rules, injection scan, rival filtering, wrong-deal warning, status rules on the main deal, submit gate, idempotent submit with a simulated timeout, the full guardrail suite, and the walkthrough script driving the real store to a submitted request with zero fields typed by hand.
- **Playwright, 7 tests** (`e2e/`): the main deal by hand from Outlook to a created intake request (toast, citation highlight, conflict choice, submit); removing the confirmation email; the wrong-supplier warning; keyboard-only completion; Escape closes the film; every walkthrough step with the network off; every narrative page fits 1280 x 800 with no console errors.

## UX laws applied

1. Jakob: the inbox follows Outlook's web layout; the add-in follows Harvey for Outlook (suggestions, answer, prompt box); the request screen follows the Sirion app (sections, documents, summary).
2. Fitts: targets at least 44 px, 8 px apart; Submit sits after the last field; Confirm and Change are never adjacent.
3. Miller: fields in four groups; IDs and money formatted; nothing to remember across screens.
4. Hick: one scenario, five sections, four suggestions in the add-in, one coach mark at a time.
5. Postel: forgiving value parsing; specific messages next to the field; fluid from 360 to 1440 px.
6. Peak-end: the peak is the citation lighting up the 4% confirmation in the email; the end is the "Intake request created" screen.
7. Tesler: the AI prefills; the owner only confirms. Typing counts against the north star.
8. Doherty: feedback under 400 ms; a toast after every add; step text while reading; friction only on Submit.
9. Von Restorff: one emphasis per view; risky actions in Quartz with a warning icon.
10. Ethics: no pre-ticked confirmations; nothing attached, submitted or sent without a click.

## Audit results

### Laws of UX, per screen

| Screen | Jakob | Fitts | Miller | Hick | Postel | Peak-end | Von Restorff | Tesler | Doherty |
|---|---|---|---|---|---|---|---|---|---|
| Start and narrative pages | Pass | Pass | Pass | Pass | Pass | n/a | Pass | n/a | Pass |
| Inbox and sidebar | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Sirion request screen | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Walkthrough | Pass | Pass | Pass | Pass | n/a | Pass | Pass | n/a | Pass |

Simplified on 21 Nov at the user's request (DECISIONS.md, C5, D22, D23): one deal, five sections, a Harvey-style add-in, and the review screen merged into a Sirion-style request screen.

Fixed during the audit:

- Modals rendered off-centre because the fade-in animation overwrote the centring transform. The animation now uses `translate`.
- Stakeholder map labels were 22 px tall. They are now 28 px on desktop, and a phone gets a list of 44 px buttons instead of the diagram.
- On a phone, the inbox squeezed the message list and reading pane side by side. It now shows a conversation picker above a full-width reading pane.
- The Metrics tables and tab bar overflowed on a phone. They now scroll inside their own box.

### Sirion Kit

- No Lilac text on white: Pass. Lilac is used only on the Midnight stage (hero, film).
- No hex outside the token table: Pass. All colours come from `src/styles/tokens.css`, including the mock mail client's blue and greys; the film cursor uses token variables.
- One Teal or Amethyst moment per view: Pass. Amethyst marks only "Watch walkthrough" and the coach mark on the next click. The mock inbox uses its own mail blue, so Sirion's teal marks only the add-in and the Sirion screens.
- Contrast 4.5:1 or better: Pass. An automated scan of every text element on all five pages and the prototype's main screens, at 1280 and 390 px wide, found no failures.
- Keyboard and focus: Pass. Skip link first, visible focus ring, the main flow completes by keyboard alone (tested), `prefers-reduced-motion` respected.

### Red team, as a Sirion PM

- Every number has a source or an assumption label: Pass. Market figures name WorldCC, Vertice and Zylo; value-case inputs are labelled Illustrative.
- Every AI answer shows its citation: Pass. Terms and core fields carry citation buttons that open the source with the sentence highlighted.
- No screen empty, broken or scrolling at 1280 x 800: Pass (tested for every narrative page).
- The walkthrough runs without the network: Pass (tested offline; fonts are self-hosted, no runtime requests leave the site).
- The five brief requirements are visibly met: Pass. Each narrative page's eyebrow names its brief item.
- Known panel risk: **no live AI call.** Outputs are hand-authored examples, clearly labelled, and the checks are real code. A panel asking for "real AI doing real work" may mark this down. This was a deliberate choice (DECISIONS.md, C2): it keeps the demo deterministic and shows the part that makes AI safe here, which is the checking.
