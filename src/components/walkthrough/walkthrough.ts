// The walkthrough script. Each step names the element to spotlight, what the
// film does there (the same store actions the UI calls), the caption and the
// duration. Steps marked `visual` only open local UI (a popover, an accordion)
// and are skipped when seeking to a later chapter.

import { actions, getState } from "@/lib/store";
import { sirion } from "@/lib/submit";
import { getDeal } from "@data/index";

export interface Step {
  target?: string;
  /** What the floating note beside the target says. Falls back to the chapter caption. */
  say?: string;
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

const UPLIFT_CONFIRM = "Confirmed: we will waive the $5,000 setup fee, and the annual uplift stays at 4%.";

/** Overall pace: every step's time is stretched by this, so the film never feels rushed. */
const PACE = 1.35;

const SCRIPT: Chapter[] = [
  {
    id: "pain",
    title: "The deal is in email",
    caption: "Manraj agreed a deal with Brightline over email. Now it has to go into Sirion.",
    steps: [
      {
        do: () => {
          actions.toggleSidebar(false);
          actions.setView("inbox");
          actions.setMailScreen("list");
        },
        target: "thread-t-bl",
        say: "Manraj agreed a deal with Brightline in this email thread.",
        ms: 3200,
      },
      {
        target: "attachment",
        do: () => {
          actions.openMessage(getDeal(getState().dealId).openMessageId);
          actions.setMailScreen("read");
        },
        say: "The final quote is attached. Now this has to go into Sirion.",
        ms: 3200,
      },
    ],
  },
  {
    id: "sidebar",
    title: "Open Sirion",
    caption: "Sirion sits beside the email. There is no intake request for this thread yet.",
    steps: [
      { target: "open-sidebar", do: () => actions.toggleSidebar(true), say: "Open the Sirion add-in from the email.", ms: 2600 },
      { target: "deal-chip", say: "Sirion sits beside the email. There is no intake request for this thread yet.", ms: 3400 },
    ],
  },
  {
    id: "add",
    title: "Start the request",
    caption: "One click starts a draft request from this thread.",
    steps: [
      { target: "create-deal", do: () => actions.createDeal(), say: "One click starts a draft request from this thread.", ms: 2600 },
      { target: "reading", do: () => actions.setReading(2), say: "Sirion reads the emails and the quote.", ms: 1500 },
      { target: "reading", do: () => actions.setReading(3), say: "Sirion reads the emails and the quote.", ms: 1300 },
      { target: "toast", do: () => actions.finishReading(), say: "The draft is saved. Nothing is submitted yet.", ms: 3200 },
    ],
  },
  {
    id: "agreed",
    title: "Check what's agreed",
    caption: "Ask what's agreed. Every term comes with the sentence it came from.",
    steps: [
      { target: "card-agreed", do: () => actions.setPanel("agreed"), say: "Ask what's agreed so far.", ms: 2000 },
      { target: "agreed-list", say: "Each agreed term, with a quote button beside it.", ms: 2600 },
      { target: "cite-mark", do: () => actions.cite("bl-06", UPLIFT_CONFIRM), say: "The quote button shows the exact sentence in the email.", ms: 3400 },
    ],
  },
  {
    id: "request",
    title: "Open it in Sirion",
    caption: "Click Review and submit in Sirion. The Sirion app opens with the draft filled in.",
    steps: [
      {
        target: "answer-review",
        do: () => {
          actions.toggleSidebar(true);
          actions.setPanel("agreed");
        },
        say: "Now click Review and submit in Sirion.",
        ms: 2400,
      },
      { target: "opening-sirion", do: () => actions.setView("sirion"), say: "The Sirion app opens.", ms: 1500 },
      { target: "sirion-here", say: "This is the Sirion app. The draft request is already filled in.", ms: 3600 },
      { target: "documents", say: "The emails and the quote came across with it.", ms: 2600 },
    ],
  },
  {
    id: "quoted",
    title: "Check and edit",
    caption: "Every value shows where it came from. Anything wrong can be edited.",
    steps: [
      { target: "source-payment", say: "Every value shows where it came from.", ms: 2200 },
      { target: "source-payment", click: true, visual: true, say: "Click it to read the exact sentence.", ms: 700 },
      { target: "source-popover", visual: true, say: "This is the sentence the value came from.", ms: 3400 },
      { target: "source-payment", click: true, visual: true, say: "Every value shows where it came from.", ms: 600 },
      { target: "edit-scope", say: "Spot a mistake? Click the pencil to edit any value. The change is logged.", ms: 3400 },
    ],
  },
  {
    id: "submit",
    title: "Submit",
    caption: "Submit. Nothing was typed by hand.",
    steps: [
      { target: "submit", do: () => actions.confirmAndSubmit(), say: "Click Submit. Nothing was typed by hand.", ms: 2400 },
      { target: "receipt", say: "The intake request is in Sirion and on its way to Legal.", ms: 3600 },
    ],
  },
];

export const CHAPTERS: Chapter[] = SCRIPT.map((c) => ({ ...c, steps: c.steps.map((st) => ({ ...st, ms: Math.round(st.ms * PACE) })) }));

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
