import { describe, expect, it } from "vitest";
import { CHAPTERS, seekState } from "@/components/walkthrough/walkthrough";
import { sessionCounters, actions, getState } from "@/lib/store";
import { sirion } from "@/lib/submit";

describe("walkthrough script drives the real store", () => {
  it("ends with one submitted request, nothing typed by hand", async () => {
    const s = await seekState(CHAPTERS.length);
    const ds = s.deals["DL-1042"];
    expect(ds.submit.requestId).toMatch(/^REQ-2026-/);
    const c = sessionCounters(s);
    expect(c.typed).toBe(0);
    expect(c.submitted).toBe(1);
  });
  it("double submit never creates a second request", async () => {
    await seekState(CHAPTERS.findIndex((c) => c.id === "submit"));
    sirion.latencyMs = 0;
    const before = sirion.count();
    const steps = CHAPTERS.find((c) => c.id === "submit")!.steps;
    for (const st of steps.slice(0, 4)) await st.do?.();
    await Promise.all([actions.submit(), actions.submit()]);
    await actions.submit();
    expect(sirion.count() - before).toBeLessThanOrEqual(1);
    expect(getState().deals["DL-1042"].submit.status).toBe("done");
  });
});
