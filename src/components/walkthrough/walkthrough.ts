// The walkthrough script. Each step names the element to spotlight, what the
// film does there (the same store actions the UI calls), the caption and the
// duration. Steps marked `visual` only open local UI (a popover, an accordion)
// and are skipped when seeking to a later chapter.

import { actions, getState } from "@/lib/store";
import { sirion } from "@/lib/submit";
import { getDeal } from "@data/index";

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

const deal = () => getDeal("DL-1042");
/** The Brightline thread: its emails and the quote PDF, as the add-in's first suggestion adds them. */
const addMainThread = () => {
  const d = deal();
  const t = d.threads.find((x) => x.id === "t-bl")!;
  actions.addMessages(t.messageIds, "thread");
};
const UPLIFT_CONFIRM = "Confirmed: we will waive the $5,000 setup fee, and the annual uplift stays at 4%.";

export const CHAPTERS: Chapter[] = [
  {
    id: "pain",
    title: "The deal is in email",
    caption: "Manraj agreed a deal with Brightline over six emails and a quote. Now it has to go into Sirion.",
    steps: [
      {
        do: () => {
          actions.toggleSidebar(false);
          actions.setView("inbox");
        },
        target: "inbox",
        ms: 3000,
      },
      { target: "thread-t-bl", ms: 2500 },
      { target: "attachment", ms: 2500 },
    ],
  },
  {
    id: "sidebar",
    title: "Open Sirion",
    caption: "Sirion sits beside the email, already on deal DL-1042.",
    steps: [
      { target: "open-sidebar", do: () => actions.toggleSidebar(true), ms: 2500 },
      { target: "sidebar", ms: 3000 },
    ],
  },
  {
    id: "add",
    title: "Add the thread",
    caption: "One click adds the emails and the quote. Nothing is read until you add it.",
    steps: [
      { target: "add-to-sirion", do: addMainThread, ms: 2200 },
      { target: "reading", do: () => actions.setReading(2), ms: 1500 },
      { target: "reading", do: () => actions.setReading(3), ms: 1500 },
      { target: "toast", do: () => actions.finishReading(), ms: 3000 },
    ],
  },
  {
    id: "agreed",
    title: "What's agreed",
    caption: "Every term comes with the sentence it came from.",
    steps: [
      { target: "agreed-list", do: () => actions.setPanel("agreed"), ms: 2400 },
      { target: "agreed-uplift", ms: 2600 },
      { target: "cite-mark", do: () => actions.cite("bl-06", UPLIFT_CONFIRM), ms: 3600 },
    ],
  },
  {
    id: "request",
    title: "Open in Sirion",
    caption: "The request is already filled in Sirion. Nothing typed by hand.",
    steps: [
      {
        target: "review-in-sirion",
        do: () => {
          actions.setPanel("home");
          actions.selectSource("bl-06");
        },
        ms: 2000,
      },
      { target: "basic-info", do: () => actions.setView("sirion"), ms: 3200 },
      { target: "documents", ms: 2600 },
    ],
  },
  {
    id: "conflict",
    title: "Settle the conflict",
    caption: "The email says Net 45. The quote says Net 30. Manraj decides, or Legal does.",
    steps: [
      { target: "conflict-payment", ms: 3400 },
      {
        target: "mark-open-payment",
        do: () =>
          actions.resolveTerm("payment", {
            type: "open",
            reason: "Net 45 (Tom's email, 13 Nov) vs Net 30 (the quote PDF, 13 Nov). Confirm which applies.",
            owner: "Legal",
          }),
        ms: 2400,
      },
      { target: "legal-open-list", ms: 3000 },
    ],
  },
  {
    id: "submit",
    title: "Submit",
    caption: "One check, one click. The request goes to Legal.",
    steps: [
      { target: "submit", do: () => actions.openSubmit(), ms: 2200 },
      { target: "confirm-check", click: true, visual: true, ms: 1800 },
      { target: "confirm-submit", do: () => actions.confirmAndSubmit(), ms: 2000 },
      { target: "receipt", ms: 3000 },
    ],
  },
  {
    id: "legal",
    title: "Legal's view",
    caption: "Legal gets what was agreed, with sources, and what is still open.",
    steps: [
      { target: "legal-evidenced", do: () => actions.setView("legal"), ms: 3000 },
      { target: "legal-open", ms: 2600 },
      { target: "start-drafting", do: () => actions.legalDecide("start"), ms: 2600 },
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
