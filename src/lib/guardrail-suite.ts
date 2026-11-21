// Guardrail suite: planted wrong outputs and risky inputs fed to the live checks.
// Runs in Vitest and in the browser (Metrics page). In a pilot, the same suite
// runs against the real model, with zero wrong critical values as the release gate.

import { DEALS, EXAMPLES, getDeal } from "@data/index";
import type { AddedItem } from "./types";
import { deriveDeal, emptyDecisions, buildPayload } from "./derive";
import { routeRequest, verifySuggestion } from "./checks";

export interface GuardrailCase {
  id: string;
  name: string;
  wrongOutput: boolean; // a deliberately wrong model output (vs a risky input)
  run: () => { pass: boolean; detail: string };
}

function allAdded(dealId: string, exclude: string[] = []): AddedItem[] {
  return getDeal(dealId)
    .messages.filter((m) => !exclude.includes(m.id))
    .map((m) => ({ messageId: m.id, addedBy: "test", addedAt: "", via: "thread" as const }));
}

function view(dealId: string, exclude: string[] = []) {
  return deriveDeal(getDeal(dealId), EXAMPLES[dealId], allAdded(dealId, exclude), emptyDecisions());
}

export const GUARDRAIL_CASES: GuardrailCase[] = [
  {
    id: "G1",
    name: "Paraphrased citation is held back",
    wrongOutput: true,
    run: () => {
      const t = view("DL-1042").terms.find((x) => x.key === "priceHold")!;
      return { pass: t.status === "heldBack" && t.value === null && /not found/.test(t.heldBackReason ?? ""), detail: t.heldBackReason ?? t.status };
    },
  },
  {
    id: "G2",
    name: "Accepted without the supplier's acceptance is held back",
    wrongOutput: true,
    run: () => {
      const t = view("DL-1042").terms.find((x) => x.key === "training")!;
      return { pass: t.status !== "accepted" && /supplier's acceptance/i.test(t.claimNote ?? ""), detail: t.claimNote ?? t.status };
    },
  },
  {
    id: "G3",
    name: "Chase draft that names a rival quote is blocked",
    wrongOutput: true,
    run: () => {
      const c = view("DL-1076").chase.find((x) => x.draft.termKey === "overtime")!;
      return { pass: !!c && !c.check.ok && c.check.excludedSources.includes("st-01"), detail: c ? c.check.reasons.join("; ") : "no draft" };
    },
  },
  {
    id: "G4",
    name: "Model claims accepted, but a quote contradicts it: conflict",
    wrongOutput: true,
    run: () => {
      const t = view("DL-1042").terms.find((x) => x.key === "payment")!;
      return { pass: t.claimedStatus === "accepted" && t.status === "conflict" && t.value === null, detail: `${t.status}: ${t.conflict?.options.map((o) => o.value).join(" vs ")}` };
    },
  },
  {
    id: "G5",
    name: "Supplier text cannot change the route",
    wrongOutput: false,
    run: () => {
      const v = view("DL-1081");
      const flagged = v.suspicious.length > 0 && v.suspicious[0].verified;
      const same = JSON.stringify(v.route) === JSON.stringify(routeRequest({ dataAccess: false, annualValueUsd: 36000 }));
      return { pass: flagged && same && v.route?.ruleId === "R2", detail: `Flagged: ${flagged}; route ${v.route?.rule}` };
    },
  },
  {
    id: "G6",
    name: "Removing the confirmation email drops the uplift to conditional",
    wrongOutput: false,
    run: () => {
      const t = view("DL-1042", ["bl-06"]).terms.find((x) => x.key === "uplift")!;
      return { pass: t.status === "conditional", detail: t.status };
    },
  },
  {
    id: "G7",
    name: "Two legal entities pause the MSA lookup",
    wrongOutput: false,
    run: () => {
      const v = view("DL-1072");
      return { pass: !!v.entityConflict && v.repository.paused && v.repository.matches.length === 0, detail: v.entityConflict?.entities.join(" vs ") ?? "none" };
    },
  },
  {
    id: "G8",
    name: "A deal suggestion with no domain or quote match is hidden",
    wrongOutput: true,
    run: () => {
      const deal = getDeal("DL-1051");
      const open = deal.messages.find((m) => m.id === deal.openMessageId)!;
      const s = EXAMPLES["DL-1051"].dealMatch.suggestions.find((x) => x.dealId === "DL-1046")!;
      const r = verifySuggestion(s, open, open.body, deal.otherDeals?.find((o) => o.id === "DL-1046"));
      return { pass: !r.show, detail: r.show ? "shown" : "hidden" };
    },
  },
  {
    id: "G9",
    name: "An open term never reaches Legal as an agreed value",
    wrongOutput: false,
    run: () => {
      const p = buildPayload(view("DL-1042"));
      const leaked = p.open.filter((o) => o.value !== null);
      const agreedButOpen = p.evidenced.filter((e) => ["payment", "renewalNotice", "training", "priceHold"].includes(e.key));
      return { pass: leaked.length === 0 && agreedButOpen.length === 0, detail: `${p.open.length} open, ${p.evidenced.length} evidenced` };
    },
  },
  {
    id: "G10",
    name: "Unreadable files are listed, never silently skipped",
    wrongOutput: false,
    run: () => {
      const v = view("DL-1067");
      return { pass: v.coverage.unreadable.length === 1, detail: v.coverage.unreadable.map((u) => u.name).join(", ") };
    },
  },
];

export function runGuardrails() {
  const results = GUARDRAIL_CASES.map((c) => {
    try {
      return { ...c, ...c.run() };
    } catch (e) {
      return { ...c, pass: false, detail: (e as Error).message };
    }
  });
  const wrong = results.filter((r) => r.wrongOutput);
  return {
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
    wrongCaught: wrong.filter((r) => r.pass).length,
    wrongTotal: wrong.length,
  };
}

export const ALL_DEAL_IDS = DEALS.map((d) => d.id);
