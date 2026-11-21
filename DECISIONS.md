# DECISIONS

Choices made where the note was silent, or where the note and the build prompt conflict. The note wins conflicts unless the user decided otherwise.

## Conflicts between sources

| # | Conflict | Decision | Why |
|---|---|---|---|
| C1 | Build prompt section 8 and the attached note say "the company has just bought Sirion and is rolling it out". The user removed this assumption from the note on 21 Nov 2026 (v4). | Dropped. The assumption reads: "The company runs contract requests and its repository in Sirion." | The user's explicit, later decision. |
| C2 | The note says deal matching, term timeline and status classification are real AI calls, with one fresh-input path. The build prompt says no live AI calls. | Follow the build prompt: hand-authored example outputs in `data/ai-examples/`, labelled "Example AI output"; the checks that judge them are real TypeScript running in the browser. No paste-your-own path. | The user wrote the build prompt and made this call. Known panel risk against "real AI doing real work"; mitigated by showing the output contract (Zod schema), planted wrong outputs caught live, and a guardrail test suite. |
| C3 | The note's screen table puts "Submit request (mocked)" on the Legal handoff screen. The build prompt puts submit on the review, then the receipt, then Legal. | Submit lives on the review (with a confirm dialog); the receipt follows; the Legal view comes after. | The prompt's flow is clearer and matches the note's flow steps 7 and 8. |

## Gap-filling choices

| # | Topic | Decision |
|---|---|---|
| D1 | Sidebar primary button after material is added | "Add to Sirion" while unadded items are ticked; then "Review in Sirion (N to resolve)" while blockers remain; "Submit request" when nothing blocks. All open the review. One primary at a time. |
| D2 | What counts as "missing" | Blockers: missing core fields and conflicts needing a decision. Terms that will go to Legal as open (not yet negotiated, conditional, held back) are listed under "Goes to Legal as open" with an owner. They do not block submit: the gate blocks unsupported assertions, not incomplete negotiations (note, field rules). |
| D3 | Default disposition for non-evidenced terms | Shown as "Goes to Legal as open" with a suggested owner. Nothing is pre-ticked; this is the honest default, not a confirmation. Accepted terms still need an explicit tick each. |
| D4 | Removing material | Added items are removable per message before submit; removal is logged. Removing an email does not remove its attachment (each is its own item). |
| D5 | Acceptance rule detail | A condition stated by one side counts as that side's acceptance once a later resolution step exists. The party that offered the final value counts as having assented to it. |
| D6 | Contradiction rule | A "statement" (a document stating a term, such as a quote line) with a different value from the final value, and not superseded by a withdrawal, is a contradiction. Negotiation steps (offer, counter) are history, not contradictions. |
| D7 | Deal-suggestion threshold | A suggestion shows only when code confirms the supplier domain or a quote / PO number actually matches the email. Others are hidden; if none pass, "New deal" is offered. |
| D8 | Routing rules (mock, Legal-owned) | R1: data access = yes, Legal and Security review. R2: value above USD 25,000, Legal intake. R3: otherwise, standard order form led by Procurement. Inputs are confirmed core fields only, never supplier text. |
| D9 | Chase drafts | Sources limited to messages from the chosen supplier's domain. A draft is held back if it mentions any confidential token on the deal (rival names, rival prices, internal limits). |
| D10 | Idempotent submit | Submit uses an idempotency key per deal. A "Simulate a timeout" switch on the confirm dialog shows the pending and failed states; retry returns the same request ID. |
| D11 | Fictional names | Company: Halden Group. Domains use `.example`. No real company names in data. |
| D12 | Planted wrong outputs in the main deal | Two extra terms in DL-1042 carry deliberately wrong model output (a paraphrased citation; an acceptance with the supplier side missing). A third sits in exploration deal 6 (a chase draft naming the rival). All labelled in "How it decides". |
| D13 | Body weight | 300 for narrative body text at 18 px or larger; 400 for UI text below 18 px (sidebar, review, tables, badges). Deviation from the kit for legibility of dense product text. |
| D14 | Status colours | Secondary brand colours (Lime, Quartz, Lilac, Mint) used as status fills, always with icon and text. Deviation from the kit, which reserves them for charts, because the product needs distinct states and the brand has no semantic colours. |
| D15 | Sirion Kit vs Tailwind defaults | Tailwind's default palette is replaced entirely by the token table; no other hex values are used outside `tokens.css` except the mock mail client's neutral greys, which reuse `ink-muted`, `line` and `surface-alt`. |
| D16 | shadcn/ui | Components follow the shadcn pattern (Radix primitives, local component files, restyled with the tokens) but are hand-written rather than generated by the shadcn CLI, to keep the default palette out. |
| D17 | Numbers on screen | Only numbers from the note, each with its source, or labelled "assumption" / "illustrative". The repository coverage figure in exploration deal 8 is labelled mock. |
