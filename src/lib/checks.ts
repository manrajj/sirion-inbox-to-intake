// Live checks. These run in the browser on the example AI outputs.
// The model only extracts and classifies; this code decides.

import type { Deal, Message, Party } from "./types";
import type { ChaseDraftOutput, ExampleOutput, TermStepOutput } from "./schema";

export const BUYER_DOMAIN = "halden.example";

export function normalise(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Check 1: the cited text exists word for word in the cited message. */
export function citationExists(quote: string, message: Message | undefined): boolean {
  if (!message) return false;
  if (message.readable === false) return false;
  return normalise(message.body).includes(normalise(quote));
}

export function domainOf(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function senderParty(message: Message, deal: Deal): Party | "other" {
  const d = domainOf(message.from.email);
  if (d === deal.supplier.domain) return "supplier";
  if (d === BUYER_DOMAIN) return "buyer";
  return "other";
}

/** Check 4a: the value parses to the field type. Forgiving on spacing and case (Postel). */
export function parseValue(fieldType: string, raw: string): { ok: boolean; parsed?: number | string } {
  const v = raw.trim();
  switch (fieldType) {
    case "money": {
      const m = v.match(/^(?:USD\s*)?\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?(?:\s*(?:a|an|per)\s+(?:year|month|hour|day|user(?:\s+per\s+month)?))?(?:\s+all in)?$/i);
      return m ? { ok: true, parsed: Number(m[1].replace(/,/g, "") + (m[2] ? "." + m[2] : "")) } : { ok: false };
    }
    case "percent": {
      const m = v.match(/^(\d+(?:\.\d+)?)\s*%$/);
      return m ? { ok: true, parsed: Number(m[1]) } : { ok: false };
    }
    case "days": {
      const m = v.match(/^(?:net\s*(\d+)|(\d+)\s*days?)$/i);
      return m ? { ok: true, parsed: Number(m[1] ?? m[2]) } : { ok: false };
    }
    case "months": {
      const m = v.match(/^(\d+)\s*months?$/i);
      return m ? { ok: true, parsed: Number(m[1]) } : { ok: false };
    }
    case "hours": {
      const m = v.match(/^(\d+)\s*hours?$/i);
      return m ? { ok: true, parsed: Number(m[1]) } : { ok: false };
    }
    case "sla": {
      const m = v.match(/(\d+(?:\.\d+)?)%\s*uptime/i);
      return m ? { ok: true, parsed: v } : { ok: false };
    }
    default:
      return v.length > 0 ? { ok: true, parsed: v } : { ok: false };
  }
}

export function sameValue(fieldType: string, a: string, b: string): boolean {
  const pa = parseValue(fieldType, a);
  const pb = parseValue(fieldType, b);
  if (pa.ok && pb.ok && typeof pa.parsed === "number" && typeof pb.parsed === "number") return pa.parsed === pb.parsed;
  return normalise(a).toLowerCase() === normalise(b).toLowerCase();
}

// ---------------------------------------------------------------------------
// Evidence bundle (check 2) and status derivation

export interface BundleResult {
  status: "proposed" | "countered" | "conditional" | "accepted" | "withdrawn" | "notNegotiated";
  value: string | null;
  missing: string[];
  unresolvedConditions: string[];
}

const NEGOTIATION_ROLES = new Set(["offer", "counter", "condition", "resolution", "acceptance", "withdrawal"]);

/**
 * Walk the in-scope steps in date order and decide the status from evidence alone.
 * A term is "accepted" only if, for the final value: there is an offer; every
 * condition on it has a later resolution; both sides assented; and at least one
 * explicit acceptance or resolved condition exists.
 */
export function evaluateBundle(
  steps: (TermStepOutput & { date: string })[],
  fieldType: string,
): BundleResult {
  const neg = steps.filter((s) => NEGOTIATION_ROLES.has(s.role)).sort((a, b) => a.date.localeCompare(b.date));
  const statements = steps.filter((s) => s.role === "statement");
  if (neg.length === 0) {
    if (statements.length === 0) return { status: "notNegotiated", value: null, missing: [], unresolvedConditions: [] };
    // Only a document states it: that is an offer from its author, not agreement.
    return { status: "proposed", value: statements[statements.length - 1].value, missing: ["Acceptance from Halden"], unresolvedConditions: [] };
  }

  const last = neg[neg.length - 1];
  if (last.role === "withdrawal") {
    return { status: "withdrawn", value: null, missing: ["A new offer after the withdrawal"], unresolvedConditions: [] };
  }

  // Only steps after the most recent withdrawal count.
  const lastWithdrawal = neg.map((s) => s.role).lastIndexOf("withdrawal");
  const live = neg.slice(lastWithdrawal + 1);
  const V = last.value;
  const forV = live.filter((s) => sameValue(fieldType, s.value, V));

  const offers = forV.filter((s) => s.role === "offer" || s.role === "counter");
  const conditions = forV.filter((s) => s.role === "condition");
  const resolutions = forV.filter((s) => s.role === "resolution");
  const acceptances = forV.filter((s) => s.role === "acceptance");

  const unresolved = conditions.filter(
    (c) => !resolutions.some((r) => r.date >= c.date && (!r.resolves || normalise(r.resolves) === normalise(c.quote))),
  );
  const resolvedConditions = conditions.filter((c) => !unresolved.includes(c));

  const assent = new Set<Party>();
  offers.forEach((s) => assent.add(s.party));
  acceptances.forEach((s) => assent.add(s.party));
  resolutions.forEach((s) => assent.add(s.party));
  resolvedConditions.forEach((s) => assent.add(s.party));

  const missing: string[] = [];
  if (offers.length === 0 && conditions.length === 0) missing.push("The offer for this value");
  if (!assent.has("supplier")) missing.push("Supplier's acceptance");
  if (!assent.has("buyer")) missing.push("Halden's acceptance");
  if (unresolved.length > 0) missing.push("Resolution of the condition");
  if (acceptances.length === 0 && resolvedConditions.length === 0) missing.push("An explicit acceptance");

  if (missing.length === 0) {
    return { status: "accepted", value: V, missing, unresolvedConditions: [] };
  }

  const status =
    unresolved.length > 0 ? "conditional" : last.role === "counter" ? "countered" : last.role === "offer" ? "proposed" : "countered";
  return { status, value: V, missing, unresolvedConditions: unresolved.map((c) => c.quote) };
}

/** Check 3: a document statement with a different, un-superseded value is a contradiction. */
export function findContradictions<T extends TermStepOutput & { date: string }>(
  steps: T[],
  fieldType: string,
  finalValue: string | null,
): T[] {
  if (!finalValue) return [];
  return steps.filter((s) => s.role === "statement" && !sameValue(fieldType, s.value, finalValue));
}

// ---------------------------------------------------------------------------
// Deal suggestions (D7): show only when a strong reason is actually true.

export function verifySuggestion(
  suggestion: ExampleOutput["dealMatch"]["suggestions"][number],
  openMessage: Message,
  openMessageText: string,
  candidate: { supplierDomain: string } | undefined,
): { show: boolean; verified: { type: string; detail: string; ok: boolean }[] } {
  const verified = suggestion.reasons.map((r) => {
    if (r.type === "supplier_domain") {
      return { ...r, ok: !!candidate && domainOf(openMessage.from.email) === candidate.supplierDomain && r.detail === candidate.supplierDomain };
    }
    if (r.type === "quote_number") {
      return { ...r, ok: normalise(openMessageText).includes(normalise(r.detail)) };
    }
    // people and product reasons are supporting only; shown, never sufficient.
    return { ...r, ok: true };
  });
  const strong = verified.some((v) => (v.type === "supplier_domain" || v.type === "quote_number") && v.ok);
  return { show: strong, verified };
}

// ---------------------------------------------------------------------------
// Supplier domain mismatch warning

export function domainMismatch(message: Message, deal: Deal): boolean {
  const d = domainOf(message.from.email);
  return d !== deal.supplier.domain && d !== BUYER_DOMAIN;
}

// ---------------------------------------------------------------------------
// Chase drafts: only the chosen supplier's own thread; nothing confidential.

export interface ChaseCheck {
  ok: boolean;
  reasons: string[];
  usableSources: string[];
  excludedSources: string[];
}

export function checkChaseDraft(draft: ChaseDraftOutput, deal: Deal, messagesById: Map<string, Message>): ChaseCheck {
  const reasons: string[] = [];
  const usable: string[] = [];
  const excluded: string[] = [];
  for (const id of draft.sourceMessageIds) {
    const m = messagesById.get(id);
    if (m && senderParty(m, deal) === "supplier") usable.push(id);
    else excluded.push(id);
  }
  if (excluded.length > 0) reasons.push(`${excluded.length} source${excluded.length > 1 ? "s" : ""} outside ${deal.supplier.name}'s own thread removed`);
  if (domainOf(draft.to) !== deal.supplier.domain) reasons.push("Recipient is not at the chosen supplier");
  const leaked = deal.confidential.filter((t) => draft.body.includes(t) || draft.subject.includes(t));
  if (leaked.length > 0) reasons.push(`Mentions confidential detail: ${leaked.map((t) => `"${t}"`).join(", ")}`);
  const ok = leaked.length === 0 && usable.length > 0 && domainOf(draft.to) === deal.supplier.domain;
  return { ok, reasons, usableSources: usable, excludedSources: excluded };
}

// ---------------------------------------------------------------------------
// Prompt injection: a second net in code, beside the model's own flag.

const INJECTION_PATTERNS = [
  /ignore (all|any|previous|prior) instructions/i,
  /skip (the )?legal/i,
  /pre-?approved/i,
  /note to (the )?(ai|assistant|model)/i,
  /mark (this|all terms) as agreed/i,
  /send (this|the) (contract|request) (to|without)/i,
];

export function scanForInstructions(text: string): string[] {
  return INJECTION_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
}

// ---------------------------------------------------------------------------
// Routing (D8). Legal-owned rules. Inputs are confirmed core fields only:
// supplier text cannot reach this function.

export interface RouteInput {
  dataAccess: boolean;
  annualValueUsd: number;
}

export interface Route {
  ruleId: "R1" | "R2" | "R3";
  queue: string;
  rule: string;
}

export function routeRequest(input: RouteInput): Route {
  if (input.dataAccess) return { ruleId: "R1", queue: "Legal intake + Security review", rule: "R1: supplier processes customer data" };
  if (input.annualValueUsd > 25000) return { ruleId: "R2", queue: "Legal intake", rule: "R2: annual value above USD 25,000" };
  return { ruleId: "R3", queue: "Procurement-led standard order form", rule: "R3: standard, low value, no data access" };
}
