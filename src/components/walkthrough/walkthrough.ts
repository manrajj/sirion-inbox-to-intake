// The walkthrough script. Each step names the element to spotlight, what the
// film does there (the same store actions the UI calls), the caption and the
// duration. Steps marked `visual` only open local UI (a popover, an accordion)
// and are skipped when seeking to a later chapter.

import { actions, getState } from "@/lib/store";
import { sirion } from "@/lib/submit";

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
  /** Which screen edge the caption bar docks to for this chapter, chosen to keep its targets clear. */
  dock?: "top" | "bottom";
  steps: Step[];
}

const UPLIFT_CONFIRM = "Confirmed: we will waive the $5,000 setup fee, and the annual uplift stays at 4%.";

export const CHAPTERS: Chapter[] = [
  {
    id: "pain",
    dock: "bottom",
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
    dock: "bottom",
    title: "Open Sirion",
    caption: "Sirion sits beside the email. There is no intake request for it yet.",
    steps: [
      { target: "open-sidebar", do: () => actions.toggleSidebar(true), ms: 2500 },
      { target: "sidebar", ms: 3000 },
    ],
  },
  {
    id: "add",
    dock: "top",
    title: "Start the request",
    caption: "One click starts a draft intake request and adds this thread, the quote, and the two internal threads about Brightline.",
    steps: [
      { target: "create-deal", do: () => actions.createDeal(), ms: 2400 },
      { target: "reading", do: () => actions.setReading(2), ms: 1500 },
      { target: "reading", do: () => actions.setReading(3), ms: 1500 },
      { target: "toast", do: () => actions.finishReading(), ms: 3000 },
    ],
  },
  {
    id: "agreed",
    dock: "bottom",
    title: "What's agreed",
    caption: "Ask what's agreed. Every term comes with the sentence it came from.",
    steps: [
      { target: "assistant-prompt", do: () => actions.setPanel("agreed"), ms: 1400 },
      { target: "agreed-list", ms: 2400 },
      { target: "cite-mark", do: () => actions.cite("bl-06", UPLIFT_CONFIRM), ms: 3400 },
    ],
  },
  {
    id: "request",
    dock: "top",
    title: "Into Sirion",
    caption: "In Sirion, the draft request is already filled in.",
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
      { target: "documents", ms: 2400 },
    ],
  },
  {
    id: "quoted",
    dock: "top",
    title: "Quoted from the emails",
    caption: "Every value shows where it came from. Click a source to read the exact sentence.",
    steps: [
      { target: "source-payment", ms: 1400 },
      { target: "source-payment", click: true, visual: true, ms: 700 },
      { target: "source-popover", visual: true, ms: 3600 },
      { target: "source-payment", click: true, visual: true, ms: 700 },
    ],
  },
  {
    id: "submit",
    dock: "top",
    title: "Request created",
    caption: "Nothing typed by hand. The intake request is in Sirion.",
    steps: [
      { target: "submit", do: () => actions.confirmAndSubmit(), ms: 2200 },
      { target: "receipt", ms: 3600 },
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
