import { describe, expect, it } from "vitest";
import { GUARDRAIL_CASES, runGuardrails } from "@/lib/guardrail-suite";

describe("guardrail suite", () => {
  for (const c of GUARDRAIL_CASES) {
    it(`${c.id}: ${c.name}`, () => {
      const r = c.run();
      expect(r.pass, r.detail).toBe(true);
    });
  }
  it("catches every planted wrong output", () => {
    const g = runGuardrails();
    expect(g.wrongCaught).toBe(g.wrongTotal);
    expect(g.wrongTotal).toBeGreaterThanOrEqual(5);
  });
});
