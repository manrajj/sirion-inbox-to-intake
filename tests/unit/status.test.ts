import { describe, expect, it } from "vitest";
import { deriveDeal, emptyDecisions, buildPayload, CORE_FIELDS } from "@/lib/derive";
import { getDeal, EXAMPLES } from "@data/index";
import type { AddedItem } from "@/lib/types";

const added = (dealId: string, exclude: string[] = []): AddedItem[] =>
  getDeal(dealId).messages.filter((m) => !exclude.includes(m.id)).map((m) => ({ messageId: m.id, addedBy: "test", addedAt: "", via: "thread" as const }));
const view = (exclude: string[] = [], d = emptyDecisions()) => deriveDeal(getDeal("DL-1042"), EXAMPLES["DL-1042"], added("DL-1042", exclude), d);
const term = (v: ReturnType<typeof view>, k: string) => v.terms.find((t) => t.key === k)!;

describe("status rules on the main deal", () => {
  it("uplift is accepted at 4% only with the confirmation email", () => {
    expect(term(view(), "uplift").status).toBe("accepted");
    expect(term(view(), "uplift").value).toBe("4%");
    expect(term(view(["bl-06"]), "uplift").status).toBe("conditional");
  });
  it("payment terms are a conflict with no value", () => {
    const t = term(view(), "payment");
    expect(t.status).toBe("conflict");
    expect(t.value).toBeNull();
    expect(t.conflict?.options.length).toBe(2);
  });
  it("a paraphrased citation is held back", () => {
    expect(term(view(), "priceHold").status).toBe("heldBack");
  });
  it("one-sided acceptance is never shown as accepted", () => {
    expect(term(view(), "training").status).not.toBe("accepted");
  });
  it("nothing added means nothing read", () => {
    const v = deriveDeal(getDeal("DL-1042"), EXAMPLES["DL-1042"], [], emptyDecisions());
    expect(v.terms.every((t) => t.status !== "accepted")).toBe(true);
  });
});

describe("submit gate", () => {
  it("blocks while core fields are unconfirmed and the conflict is unresolved", () => {
    const v = view();
    expect(v.blockers.some((b) => b.kind === "core-unconfirmed")).toBe(true);
    expect(v.blockers.some((b) => b.kind === "conflict")).toBe(true);
    expect(v.blockers.some((b) => b.kind === "record")).toBe(true);
  });
  it("opens once the owner confirms, resolves and declares the record complete", () => {
    const d = emptyDecisions();
    CORE_FIELDS.forEach((f) => (d.confirmedCore[f.key] = true));
    ["price", "uplift", "sla"].forEach((k) => (d.confirmedTerms[k] = true));
    d.resolutions.payment = { type: "open", reason: "Net 45 vs Net 30", owner: "Legal" };
    d.recordComplete = true;
    const v = view([], d);
    expect(v.blockers).toEqual([]);
    expect(v.typedByHand).toBe(0);
    const p = buildPayload(v);
    expect(p.open.every((o) => o.value === null)).toBe(true);
    expect(p.evidenced.map((e) => e.key)).not.toContain("payment");
    expect(p.route?.ruleId).toBeDefined();
  });
});
