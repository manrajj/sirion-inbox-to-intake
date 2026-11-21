// The walkthrough script. Each step names the element to spotlight, what the
// film does there (the same store actions the UI calls), the caption and the
// duration. Steps marked `visual` only open local UI (a popover, an accordion)
// and are skipped when seeking to a later chapter.

import { actions, getState } from "@/lib/store";
import { sirion } from "@/lib/submit";
import { CORE_FIELDS } from "@/lib/derive";

export interface Step {
  target?: string;
  do?: () => void | Promise<void>;
  /** A DOM click on the target, for local UI state only. */
  click?: boolean;
  visual?: boolean;
  ms: number;
}

export interface Chapter {
  id: string;
  title: string;
  caption: string;
  steps: Step[];
}

const confirmAllCore = () => CORE_FIELDS.forEach((f) => actions.confirmCore(f.key, true));

export const CHAPTERS: Chapter[] = [
  {
    id: "pain",
    title: "The pain",
    caption: "The deal is agreed. Now it has to be retyped into Sirion.",
    steps: [
      {
        do: () => {
          actions.loadDeal("DL-1042");
          actions.toggleSidebar(false);
          actions.setView("inbox");
        },
        target: "inbox",
        ms: 3500,
      },
      { target: "thread-t-bl", ms: 3000 },
      { target: "attachment", ms: 3000 },
    ],
  },
  {
    id: "sidebar",
    title: "Open the sidebar",
    caption: "Sirion lives where the deal happened.",
    steps: [
      { target: "open-sidebar", do: () => actions.toggleSidebar(true), ms: 2500 },
      { target: "sidebar", ms: 5000 },
    ],
  },
  {
    id: "deal",
    title: "Pick the deal",
    caption: "Every action applies to one deal.",
    steps: [
      { target: "deal-picker", click: true, visual: true, ms: 2500 },
      { target: "pick-DL-1042", click: true, visual: true, ms: 2500 },
      { target: "deal-picker", do: () => actions.pickDeal("DL-1042"), ms: 3000 },
    ],
  },
  {
    id: "add",
    title: "Add the material",
    caption: "Nothing is read until you add it.",
    steps: [
      { target: "context-chips", ms: 4500 },
      { target: "add-to-sirion", do: () => actions.addTicked(), ms: 2500 },
      { target: "reading", ms: 2500 },
    ],
  },
  {
    id: "at",
    title: "Add another thread",
    caption: "Pull in the rest of the deal.",
    steps: [
      { target: "at-input", do: () => actions.setAtOpen(true), ms: 3000 },
      { target: "at-t-fin", do: () => actions.addThread("t-fin"), ms: 3000 },
      { target: "added-items", ms: 3000 },
    ],
  },
  {
    id: "reading",
    title: "AI reading",
    caption: "Reading only what you added.",
    steps: [
      { target: "reading", do: () => actions.setReading(1), ms: 2200 },
      { target: "reading", do: () => actions.setReading(2), ms: 2200 },
      { target: "reading", do: () => actions.setReading(3), ms: 2200 },
      { target: "card-agreed", do: () => actions.finishReading(), ms: 3000 },
    ],
  },
  {
    id: "uplift",
    title: "The uplift term",
    caption: "Agreed only when the evidence says so.",
    steps: [
      { target: "agreed-uplift", ms: 2000 },
      { target: "term-uplift", do: () => actions.setView("review"), ms: 1800 },
      { target: "toggle-uplift", click: true, visual: true, ms: 1800 },
      { target: "step-uplift-0", do: () => actions.selectSource("bl-01", "Pricing includes a 6% annual uplift from year two"), ms: 2200 },
      { target: "step-uplift-2", do: () => actions.selectSource("bl-04", "OK on 4% if you drop the setup fee."), ms: 2600 },
      { target: "step-uplift-3", do: () => actions.selectSource("bl-06", "Confirmed: we will waive the $5,000 setup fee, and the annual uplift stays at 4%."), ms: 2600 },
      { target: "cite-mark", ms: 2400 },
      { target: "confirm-uplift", do: () => actions.confirmTerm("uplift", true), ms: 1800 },
    ],
  },
  {
    id: "conflict",
    title: "The conflict",
    caption: "Open items go to Legal honestly.",
    steps: [
      {
        target: "conflict-payment",
        do: () => {
          actions.setView("review");
          actions.selectSource("pdf-q2291", "Payment terms: Net 30 from invoice date.");
        },
        ms: 3200,
      },
      { target: "mark-open-payment", click: true, visual: true, ms: 2200 },
      { target: "mark-open-form-payment", ms: 2600 },
      {
        target: "term-head-payment",
        do: () =>
          actions.resolveTerm("payment", {
            type: "open",
            reason: "Net 45 (Tom, 13 Nov) vs Net 30 (Grace, 13 Nov quote). Confirm which applies.",
            owner: "Legal",
          }),
        ms: 3000,
      },
    ],
  },
  {
    id: "existing",
    title: "What we already have",
    caption: "Legal decides the paper. We show what exists.",
    steps: [
      { target: "card-existing", do: () => actions.setView("inbox"), ms: 5000 },
      { target: "card-missing", ms: 4000 },
    ],
  },
  {
    id: "submit",
    title: "Submit",
    caption: "One deliberate click. Nothing typed by hand.",
    steps: [
      { target: "core-legalEntity", do: () => { actions.setView("review"); confirmAllCore(); }, ms: 2600 },
      { target: "term-price", do: () => { actions.confirmTerm("price", true); actions.confirmTerm("sla", true); }, ms: 2000 },
      { target: "record-complete", do: () => actions.setRecordComplete(true), ms: 2200 },
      { target: "submit", do: () => actions.openSubmit(), ms: 3000 },
      { target: "confirm-submit", do: () => actions.submit(), ms: 2200 },
      { target: "typed-count", ms: 2500 },
    ],
  },
  {
    id: "legal",
    title: "Legal's view",
    caption: "Legal drafts from evidence, not memory.",
    steps: [
      { target: "legal-evidenced", do: () => actions.setView("legal"), ms: 3200 },
      { target: "legal-open", ms: 3200 },
      { target: "start-drafting", do: () => actions.legalDecide("start"), ms: 2800 },
    ],
  },
  {
    id: "trail",
    title: "The deal trail",
    caption: "The reason behind the clause stays with the clause.",
    steps: [
      { target: "invoice-flag", do: () => actions.setView("record"), ms: 3800 },
      { target: "clause-uplift", ms: 3000 },
      { target: "deal-trail", ms: 4500 },
    ],
  },
];

export const TOTAL_MS = CHAPTERS.reduce((a, c) => a + c.steps.reduce((b, s) => b + s.ms, 0), 0);
export const chapterMs = (i: number) => CHAPTERS[i].steps.reduce((b, s) => b + s.ms, 0);
export const chapterStart = (i: number) => CHAPTERS.slice(0, i).reduce((a, _, k) => a + chapterMs(k), 0);

/** Rebuild the exact app state at the start of chapter i, instantly. */
export async function seekState(i: number) {
  const latency = sirion.latencyMs;
  sirion.latencyMs = 0;
  actions.reset();
  actions.setFilm(true);
  for (let c = 0; c < i; c++) {
    for (const s of CHAPTERS[c].steps) {
      if (s.do && !s.visual) await s.do();
    }
  }
  actions.finishReading();
  actions.setAtOpen(false);
  sirion.latencyMs = latency;
  return getState();
}
