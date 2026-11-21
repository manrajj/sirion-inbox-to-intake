// Mocked Sirion intake endpoint with idempotent submit (D10).
// The same idempotency key always returns the same request: retries never duplicate.

export interface SirionRequest {
  requestId: string;
  dealId: string;
  createdAt: string;
  payloadHash: string;
}

export class MockSirion {
  private byKey = new Map<string, SirionRequest>();
  private seq = 4410;
  created = 0;

  constructor(public latencyMs = 700) {}

  /** Simulates a timeout on the response, after the server has recorded the request. */
  async submit(key: string, dealId: string, payload: unknown, opts: { simulateTimeout?: boolean } = {}): Promise<SirionRequest> {
    await new Promise((r) => setTimeout(r, this.latencyMs));
    let req = this.byKey.get(key);
    if (!req) {
      req = { requestId: `REQ-2026-${++this.seq}`, dealId, createdAt: new Date().toISOString(), payloadHash: hash(JSON.stringify(payload)) };
      this.byKey.set(key, req);
      this.created++;
    }
    if (opts.simulateTimeout) throw new Error("Sirion did not respond in time");
    return req;
  }

  count() {
    return this.byKey.size;
  }
}

export function hash(s: string): string {
  // Small non-cryptographic hash for the mock audit record (FNV-1a).
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const sirion = new MockSirion();
