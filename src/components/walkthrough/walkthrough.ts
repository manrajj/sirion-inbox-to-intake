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
      { target: "agreed-list", do: () => actions.setPanel("agreed"), ms: 2600 },
      { target: "cite-mark", do: () => actions.cite("bl-06", UPLIFT_CONFIRM), ms: 3400 },
    ],
  },
  {
    id: "request",
    title: "Into Sirion",
    caption: "One click, and the intake request is already filled in Sirion.",
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
    id: "conflict",
    title: "One decision",
    caption: "The email says Net 45, the quote says Net 30. Manraj picks the later email.",
    steps: [
      { target: "options-payment", ms: 2600 },
      { target: "options-payment", do: () => actions.resolveTerm("payment", { type: "picked", value: "Net 45", messageId: "bl-06" }), ms: 2200 },
    ],
  },
  {
    id: "submit",
    title: "Request created",
    caption: "Nothing typed by hand. The intake request is in Sirion.",
    steps: [
      { target: "confirm-check", click: true, visual: true, ms: 1600 },
      { target: "submit", do: () => actions.confirmAndSubmit(), ms: 1800 },
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
