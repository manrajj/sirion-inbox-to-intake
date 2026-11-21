import { describe, expect, it } from "vitest";
import { MockSirion } from "@/lib/submit";

describe("idempotent submit", () => {
  it("returns the same request for the same key", async () => {
    const s = new MockSirion(0);
    const a = await s.submit("DL-1042-intake", "DL-1042", { a: 1 });
    const b = await s.submit("DL-1042-intake", "DL-1042", { a: 1 });
    expect(a.requestId).toBe(b.requestId);
    expect(s.count()).toBe(1);
  });
  it("a timed-out first attempt is recorded once; the retry returns it", async () => {
    const s = new MockSirion(0);
    await expect(s.submit("k", "DL-1042", {}, { simulateTimeout: true })).rejects.toThrow();
    const r = await s.submit("k", "DL-1042", {});
    expect(s.count()).toBe(1);
    expect(r.requestId).toMatch(/^REQ-2026-/);
  });
});
