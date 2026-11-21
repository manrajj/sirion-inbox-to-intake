# Sirion Inbox-to-Intake

A clickable prototype for the ISB x Sirion APM case. A Sirion sidebar in Outlook and Gmail lets a procurement contract owner add a deal's emails and quotes to a deal ID, and builds the Sirion intake request from them, with every term cited. Legal receives the evidenced position and the open items, marked honestly.

- Live site: deploying to Vercel (link added here once live)
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
data/                 deals (1 main, 8 exploration), people, example AI outputs (JSON)
src/lib/
  schema.ts           Zod contract for model output
  checks.ts           live checks: citation, bundle, contradiction, parse, routing, chase, injection
  derive.ts           deal view: statuses, core fields, coverage, blockers, payload
  store.ts            one external store (useSyncExternalStore); UI and walkthrough call the same actions
  submit.ts           mock Sirion endpoint with idempotency keys
  guardrail-suite.ts  planted wrong outputs and risky inputs, run in Vitest and in the browser
src/components/
  product/            mail client, sidebar, review, receipt, Legal view, contract record, drawers
  narrative/          start page and the brief sections
  walkthrough/        the film: script (walkthrough.ts) and player (Film.tsx)
src/app/              one route per section, static export
```

The model's job is to extract and classify. Code decides what is shown as agreed. A term is "Accepted by both" only when the cited text exists word for word, the offer and acceptance come from opposite sides, conditions are resolved, nothing later contradicts it, and the owner confirms. Anything else is held back or goes to Legal as open, with a reason and an owner.

## Tests

- **Vitest, 37 tests** (`tests/unit/`): citation verifier, value parsing, routing rules, injection scan, rival filtering, wrong-deal warning, status rules on the main deal, submit gate, idempotent submit with a simulated timeout, the full guardrail suite, and the walkthrough script driving the real store to a submitted request with zero fields typed by hand.
- **Playwright, 15 tests** (`e2e/`): the main deal by hand from inbox to contract record; removing the confirmation email; the wrong-supplier warning; all eight exploration deals; keyboard-only completion of the main flow; Escape closes the film; every chapter of the walkthrough with the network off; every narrative page fits 1280 x 800 with no console errors.

## UX laws applied

1. Jakob: the inbox follows Outlook's web layout (command bar, folders, message list, reading pane, add-in pane on the right); review uses a reading pane.
2. Fitts: targets at least 44 px, 8 px apart; Submit sits after the last field; Confirm and Change are never adjacent.
3. Miller: fields in four groups; IDs and money formatted; nothing to remember across screens.
4. Hick: one primary action per screen; detail behind Timeline, Checks and Details.
5. Postel: forgiving value parsing; specific messages next to the field; fluid from 360 to 1440 px.
6. Peak-end: the peak is the citation lighting up the 4% condition; the end is a clear receipt.
7. Tesler: the AI prefills; the owner only confirms. Typing counts against the north star.
8. Doherty: feedback under 400 ms; step text while reading; friction only on Submit.
9. Von Restorff: one emphasis per view; risky actions in Quartz with a warning icon.
10. Ethics: no pre-ticked confirmations; nothing attached, submitted or sent without a click.

The same note is in the app under "Design notes".

## Audit results

### Laws of UX, per screen

| Screen | Jakob | Fitts | Miller | Hick | Postel | Peak-end | Von Restorff | Tesler | Doherty |
|---|---|---|---|---|---|---|---|---|---|
| Start and narrative pages | Pass | Pass | Pass | Pass | Pass | n/a | Pass | n/a | Pass |
| Inbox and sidebar | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Review | Pass | Pass | Pass | Partial | Pass | Pass | Pass | Pass | Pass |
| Receipt and Legal view | Pass | Pass | Pass | Pass | n/a | Pass | Pass | Pass | Pass |
| Contract record | Pass | Pass | Pass | Pass | n/a | Pass | Pass | n/a | Pass |
| Walkthrough | Pass | Pass | Pass | Pass | n/a | Pass | Pass | n/a | Pass |

Partial, justified: the review screen shows four field groups and seven terms at once. Splitting it into steps would hide the full position the owner signs off, which is the point of the screen. Detail is collapsed behind Timeline and Checks, and one primary action (Submit) sits at the end.

Fixed during the audit:

- Modals rendered off-centre because the fade-in animation overwrote the centring transform. The animation now uses `translate`.
- Stakeholder map labels were 22 px tall. They are now 28 px on desktop, and a phone gets a list of 44 px buttons instead of the diagram.
- On a phone, the inbox squeezed the message list and reading pane side by side. It now shows a conversation picker above a full-width reading pane. Review rows stack label over value.
- The Metrics tables and tab bar overflowed on a phone. They now scroll inside their own box.

### Sirion Kit

- No Lilac text on white: Pass. Lilac is used only on the Midnight stage (hero, film).
- No hex outside the token table: Pass. All colours come from `src/styles/tokens.css`, including the mock mail client's blue and greys; the film cursor uses token variables.
- One Teal or Amethyst moment per view: Pass. Amethyst appears once, on "Watch the 2-minute walkthrough". The mock inbox uses its own mail blue, so Sirion's teal marks only the add-in.
- Contrast 4.5:1 or better: Pass. An automated scan of every text element on all nine pages, at 1280 and 390 px wide, found no failures.
- Keyboard and focus: Pass. Skip link first, visible focus ring, the main flow completes by keyboard alone (tested), `prefers-reduced-motion` respected.

### Red team, as a Sirion PM

- Every number has a source or an assumption label: Pass. Market figures name WorldCC, Vertice and Zylo; value-case inputs are labelled Illustrative.
- Every AI answer shows its citation: Pass. Terms and core fields carry citation buttons that open the source with the sentence highlighted.
- No screen empty, broken or scrolling at 1280 x 800: Pass (tested for every narrative page).
- The walkthrough runs without the network: Pass (tested offline; fonts are self-hosted, no runtime requests leave the site).
- The five brief requirements are visibly met: Pass. Each narrative page's eyebrow names its brief item.
- Known panel risk: **no live AI call.** Outputs are hand-authored examples, clearly labelled, and the checks are real code. A panel asking for "real AI doing real work" may mark this down. This was a deliberate choice (DECISIONS.md, C2): it keeps the demo deterministic and shows the part that makes AI safe here, which is the checking.
