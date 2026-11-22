// Derives everything the UI shows from: the deal data, the example AI output,
// the material the owner has added, and the owner's decisions.

import type { AddedItem, Deal, DisplayStatus, Message, Resolution } from "./types";
import type { CoreFieldKeyT, ExampleOutput, TermOutput, TermStepOutput } from "./schema";
import {
  citationExists,
  evaluateBundle,
  findContradictions,
  normalise,
  parseValue,
  senderParty,
  checkChaseDraft,
  scanForInstructions,
  routeRequest,
  type ChaseCheck,
  type Route,
} from "./checks";

export const CORE_FIELDS: { key: CoreFieldKeyT; label: string; group: "supplier" | "internal" }[] = [
  { key: "legalEntity", label: "Supplier legal entity", group: "supplier" },
  { key: "scope", label: "Scope", group: "supplier" },
  { key: "value", label: "Value and currency", group: "supplier" },
  { key: "termStart", label: "Term and start date", group: "supplier" },
  { key: "requester", label: "Requester", group: "internal" },
  { key: "costCentre", label: "Cost centre", group: "internal" },
  { key: "dataAccess", label: "Data access", group: "internal" },
];

export interface CheckOutcome {
  id: 1 | 2 | 3 | 4 | 5;
  label: string;
  pass: boolean | null; // null = not applicable / waiting on owner
  detail: string;
}

export interface StepView extends TermStepOutput {
  date: string;
  author: string;
  verified: boolean;
  partyOk: boolean;
}

export interface TermView {
  key: string;
  label: string;
  group: TermOutput["group"];
  fieldType: string;
  status: DisplayStatus;
  /** Status from evidence alone, before the owner's resolution. */
  evidenceStatus: DisplayStatus;
  value: string | null;
  steps: StepView[];
  excludedSteps: number;
  checks: CheckOutcome[];
  heldBackReason?: string;
  claimNote?: string;
  conflict?: { options: { value: string; messageId: string; quote: string; date: string; author: string }[] };
  needsDecision: boolean;
  goesToLegalOpen: boolean;
  openOwner: string;
  claimedStatus: TermOutput["claimedStatus"];
  claimedValue: string | null;
  plantedFlaw?: string;
  confirmed: boolean;
  resolution?: Resolution;
}

export interface CoreFieldView {
  key: CoreFieldKeyT;
  label: string;
  group: "supplier" | "internal";
  value: string | null;
  evidence: { messageId: string; quote: string }[];
  /** What the emails said, kept when the owner edits the value. */
  aiEvidence?: { messageId: string; quote: string }[];
  source: "ai" | "draft" | "typed" | "picked" | "missing";
  confirmed: boolean;
  conflictOptions?: string[];
}

export interface OwnerDecisions {
  confirmedTerms: Record<string, boolean>;
  resolutions: Record<string, Resolution | undefined>;
  confirmedCore: Record<string, boolean>;
  typedCore: Record<string, string | undefined>;
  pickedCore: Record<string, string | undefined>;
  recordComplete: boolean;
  /** Conflicts Sirion preselected (the later message), until the owner picks. */
  preselected?: Record<string, boolean>;
}

export const emptyDecisions = (): OwnerDecisions => ({
  confirmedTerms: {},
  resolutions: {},
  confirmedCore: {},
  typedCore: {},
  pickedCore: {},
  recordComplete: false,
});

export interface DealView {
  deal: Deal;
  added: AddedItem[];
  addedIds: Set<string>;
  terms: TermView[];
  core: CoreFieldView[];
  coverage: Coverage;
  entityConflict: { entities: string[]; quotes: { messageId: string; quote: string; entity: string }[] } | null;
  repository: { paused: boolean; matches: Deal["repository"]["records"]; restrictedHidden: number; coverage: string; noMatch: boolean };
  contractType: ExampleOutput["contractType"] & { verified: boolean };
  suspicious: { messageId: string; quote: string; note: string; verified: boolean; codePatterns: string[] }[];
  chase: { draft: ExampleOutput["chaseDrafts"][number]; check: ChaseCheck }[];
  blockers: Blocker[];
  openForLegal: TermView[];
  typedByHand: number;
  route: Route | null;
  citationsVerified: number;
  termsHeldBack: number;
}

export interface Blocker {
  kind: "core-missing" | "core-unconfirmed" | "conflict" | "term-unconfirmed" | "record" | "entity";
  label: string;
  ref?: string;
}

export interface Coverage {
  messagesRead: number;
  pdfsRead: number;
  from: string | null;
  to: string | null;
  addedBy: { name: string; count: number }[];
  unreadable: { id: string; name: string; reason: string }[];
  threads: { id: string; label: string; added: number; total: number; lastAdded: string | null; lastAuthor: string | null; laterNotAdded: number }[];
  latest: { date: string; author: string; party: string } | null;
}

export function messageText(m: Message, byId: Map<string, Message>): string {
  const att = (m.attachmentIds ?? []).map((id) => byId.get(id)?.body ?? "").join("\n");
  return `${m.subject}\n${m.body}\n${att}`;
}

export function deriveDeal(deal: Deal, ai: ExampleOutput, added: AddedItem[], decisions: OwnerDecisions): DealView {
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const live = added.filter((a) => !a.removed);
  const addedIds = new Set(live.map((a) => a.messageId));
  const inScope = (id: string) => addedIds.has(id) && byId.get(id)?.readable !== false;

  // ---- Entity check (part of check 4)
  const mentions = ai.entityMentions.filter((e) => inScope(e.messageId) && citationExists(e.quote, byId.get(e.messageId)));
  const wrongEntity = mentions.filter((e) => normalise(e.entity).toLowerCase() !== normalise(deal.supplier.legalEntity).toLowerCase());
  const pickedEntity = decisions.pickedCore["legalEntity"];
  const entityResolved = !!pickedEntity && normalise(pickedEntity).toLowerCase() === normalise(deal.supplier.legalEntity).toLowerCase();
  const entityConflict =
    wrongEntity.length > 0 && !entityResolved
      ? { entities: Array.from(new Set(mentions.map((m) => m.entity))), quotes: mentions }
      : null;
  const wrongEntityMsgs = new Set(wrongEntity.map((e) => e.messageId));

  let citationsVerified = 0;

  // ---- Terms
  const terms: TermView[] = ai.terms.map((t) => {
    const all = t.steps.map((s) => {
      const m = byId.get(s.messageId);
      const verified = citationExists(s.quote, m);
      const party = m ? senderParty(m, deal) : "other";
      return {
        ...s,
        date: m?.date ?? "",
        author: m ? m.from.name : "Unknown",
        verified,
        partyOk: party === s.party,
      } as StepView;
    });
    const steps = all.filter((s) => inScope(s.messageId)).sort((a, b) => a.date.localeCompare(b.date));
    const excludedSteps = all.length - steps.length;
    citationsVerified += steps.filter((s) => s.verified).length;

    const checks: CheckOutcome[] = [];
    const badCite = steps.filter((s) => !s.verified);
    checks.push({
      id: 1,
      label: "Cited text found word for word",
      pass: steps.length === 0 ? null : badCite.length === 0,
      detail: badCite.length ? `Not found: "${badCite[0].quote}"` : steps.length ? `${steps.length} citation${steps.length > 1 ? "s" : ""} matched` : "No evidence in added material",
    });

    const badParty = steps.filter((s) => s.verified && !s.partyOk);
    const badValue = steps.filter((s) => !parseValue(t.fieldType, s.value).ok);
    const entityHit = steps.filter((s) => wrongEntityMsgs.has(s.messageId));

    let heldBackReason: string | undefined;
    if (badCite.length) heldBackReason = "Held back: the AI's quote is not in the email word for word";
    else if (badParty.length) heldBackReason = "Held back: evidence does not come from the side it claims";
    else if (badValue.length) heldBackReason = `Held back: "${badValue[0].value}" does not parse as ${t.fieldType}`;
    else if (entityHit.length && entityConflict) heldBackReason = "Held back: evidence names a different legal entity";

    const usable = heldBackReason ? [] : steps;
    const bundle = evaluateBundle(usable, t.fieldType);
    checks.push({
      id: 2,
      label: "Evidence bundle complete",
      pass: heldBackReason ? null : bundle.status === "notNegotiated" ? null : bundle.missing.length === 0,
      detail: heldBackReason ? "Not evaluated" : bundle.missing.length ? `Missing: ${bundle.missing.join(", ")}` : bundle.status === "notNegotiated" ? "Not mentioned in added material" : "Offer, conditions, resolution and both sides present",
    });

    const contradictions = heldBackReason ? [] : findContradictions(usable, t.fieldType, bundle.value);
    checks.push({
      id: 3,
      label: "No contradiction in added material",
      pass: heldBackReason || bundle.status === "notNegotiated" ? null : contradictions.length === 0,
      detail: contradictions.length ? `${contradictions[0].author} document says ${contradictions[0].value}` : "None found",
    });
    checks.push({
      id: 4,
      label: "Value parses; sender and entity match",
      pass: steps.length === 0 ? null : !(badParty.length || badValue.length || (entityHit.length && entityConflict)),
      detail: badParty.length ? "Sender side mismatch" : badValue.length ? "Value does not parse" : entityHit.length && entityConflict ? "Entity differs from the deal" : steps.length ? "Parsed and matched" : "No evidence",
    });

    let evidenceStatus: DisplayStatus;
    let value: string | null = null;
    let conflict: TermView["conflict"];
    if (heldBackReason) {
      evidenceStatus = "heldBack";
    } else if (contradictions.length) {
      evidenceStatus = "conflict";
      const finalStep = [...usable].reverse().find((s) => s.role !== "statement")!;
      conflict = {
        options: [finalStep, ...contradictions].map((s) => ({ value: s.value, messageId: s.messageId, quote: s.quote, date: s.date, author: s.author })),
      };
    } else {
      evidenceStatus = bundle.status;
      value = bundle.value;
    }

    let claimNote: string | undefined;
    if (!heldBackReason && t.claimedStatus === "accepted" && bundle.status !== "accepted" && !contradictions.length) {
      claimNote = `Model said accepted. Held back: ${bundle.missing.join(", ").toLowerCase()} missing`;
    }

    const resolution = decisions.resolutions[t.key];
    let status: DisplayStatus = evidenceStatus;
    if (resolution?.type === "open") status = "openForLegal";
    else if (resolution?.type === "offEmail") {
      status = "offEmail";
      value = resolution.value;
    } else if (resolution?.type === "picked" && evidenceStatus === "conflict") {
      status = "accepted";
      value = resolution.value;
    }

    const confirmed = !!decisions.confirmedTerms[t.key];
    checks.push({
      id: 5,
      label: "Owner confirms",
      pass: status === "accepted" || status === "offEmail" ? confirmed : null,
      detail: status === "accepted" || status === "offEmail" ? (confirmed ? "Confirmed by owner" : "Waiting for your tick") : "Not needed: goes to Legal open",
    });

    const needsDecision = status === "conflict";
    const goesToLegalOpen = !needsDecision && status !== "accepted" && status !== "offEmail";

    return {
      key: t.key,
      label: t.label,
      group: t.group,
      fieldType: t.fieldType,
      status,
      evidenceStatus,
      value: status === "heldBack" || status === "conflict" ? null : value,
      steps,
      excludedSteps,
      checks,
      heldBackReason,
      claimNote,
      conflict,
      needsDecision,
      goesToLegalOpen,
      openOwner: resolution?.type === "open" ? resolution.owner : t.openOwner,
      claimedStatus: t.claimedStatus,
      claimedValue: t.claimedValue,
      plantedFlaw: t.plantedFlaw,
      confirmed,
      resolution,
    };
  });

  // ---- Core fields
  const core: CoreFieldView[] = CORE_FIELDS.map((f) => {
    const out = ai.coreFields.find((c) => c.key === f.key);
    const evidence = (out?.evidence ?? []).filter((e) => inScope(e.messageId) && citationExists(e.quote, byId.get(e.messageId)));
    citationsVerified += evidence.length;
    const typed = decisions.typedCore[f.key];
    const picked = decisions.pickedCore[f.key];
    let value: string | null = evidence.length && out ? out.value : null;
    let source: CoreFieldView["source"] = value ? "ai" : "missing";
    const draftValue = deal.draftFields?.[f.key as keyof NonNullable<Deal["draftFields"]>];
    if (!value && draftValue) {
      value = draftValue;
      source = "draft";
    }
    let conflictOptions: string[] | undefined;
    if (f.key === "legalEntity" && entityConflict) {
      value = null;
      source = "missing";
      conflictOptions = entityConflict.entities;
    }
    if (picked) {
      value = picked;
      source = "picked";
    }
    if (typed !== undefined && typed.trim() !== "") {
      value = typed;
      source = "typed";
    }
    return {
      key: f.key,
      label: f.label,
      group: f.group,
      value,
      evidence: source === "typed" ? [] : evidence,
      aiEvidence: evidence,
      source,
      confirmed: !!decisions.confirmedCore[f.key] && value !== null,
      conflictOptions,
    };
  });

  // ---- Coverage
  const liveMsgs = live.map((a) => byId.get(a.messageId)).filter(Boolean) as Message[];
  const readable = liveMsgs.filter((m) => m.readable !== false);
  const dates = readable.map((m) => m.date).sort();
  const addedByMap = new Map<string, number>();
  live.forEach((a) => addedByMap.set(a.addedBy, (addedByMap.get(a.addedBy) ?? 0) + 1));
  const latestMsg = [...readable].sort((a, b) => b.date.localeCompare(a.date))[0];
  const coverage: Coverage = {
    messagesRead: readable.filter((m) => m.kind === "email").length,
    pdfsRead: readable.filter((m) => m.kind === "pdf").length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    addedBy: Array.from(addedByMap.entries()).map(([name, count]) => ({ name, count })),
    unreadable: liveMsgs.filter((m) => m.readable === false).map((m) => ({ id: m.id, name: m.filename ?? m.subject, reason: m.unreadableReason ?? "Not readable" })),
    threads: deal.threads
      .map((t) => {
        const addedHere = t.messageIds.filter((id) => addedIds.has(id));
        const lastAddedId = [...addedHere].sort((a, b) => (byId.get(a)!.date < byId.get(b)!.date ? -1 : 1)).pop();
        const lastAdded = lastAddedId ? byId.get(lastAddedId)! : null;
        const laterNotAdded = lastAdded ? t.messageIds.filter((id) => !addedIds.has(id) && byId.get(id)!.date > lastAdded.date && byId.get(id)!.kind === "email").length : 0;
        return { id: t.id, label: t.label, added: addedHere.length, total: t.messageIds.length, lastAdded: lastAdded?.date ?? null, lastAuthor: lastAdded?.from.name ?? null, laterNotAdded };
      })
      .filter((t) => t.added > 0),
    latest: latestMsg ? { date: latestMsg.date, author: latestMsg.from.name, party: senderParty(latestMsg, deal) } : null,
  };

  // ---- Repository lookup (act alone, read-only). Paused on entity conflict.
  const records = deal.repository.records;
  const visible = records.filter((r) => !r.restricted && normalise(r.entity).toLowerCase() === normalise(deal.supplier.legalEntity).toLowerCase());
  const repository = {
    paused: !!entityConflict,
    matches: entityConflict ? [] : visible,
    restrictedHidden: records.filter((r) => r.restricted).length,
    coverage: deal.repository.coverage,
    noMatch: !entityConflict && visible.length === 0,
  };

  const contractType = {
    ...ai.contractType,
    verified: ai.contractType.evidence.every((e) => inScope(e.messageId) && citationExists(e.quote, byId.get(e.messageId))),
  };

  // ---- Suspicious instructions: model flag + code scan, both shown.
  const suspicious = ai.flags
    .filter((f) => inScope(f.messageId))
    .map((f) => ({
      messageId: f.messageId,
      quote: f.quote,
      note: f.note,
      verified: citationExists(f.quote, byId.get(f.messageId)),
      codePatterns: scanForInstructions(byId.get(f.messageId)?.body ?? ""),
    }));
  // Code also catches instructions the model missed.
  readable.forEach((m) => {
    if (senderParty(m, deal) === "buyer") return;
    const hits = scanForInstructions(m.body);
    if (hits.length && !suspicious.some((s) => s.messageId === m.id)) {
      suspicious.push({ messageId: m.id, quote: "", note: "Found by code scan, not by the model", verified: false, codePatterns: hits });
    }
  });

  // ---- Chase drafts: only for terms still open, only if sources are added.
  const chase = ai.chaseDrafts
    .filter((d) => {
      const term = terms.find((t) => t.key === d.termKey);
      return term && term.goesToLegalOpen && term.openOwner === "Supplier";
    })
    .map((draft) => ({ draft, check: checkChaseDraft(draft, deal, byId) }));

  // ---- Submit gate
  const blockers: Blocker[] = [];
  if (entityConflict) blockers.push({ kind: "entity", label: "Supplier legal entity differs across threads", ref: "legalEntity" });
  core.forEach((c) => {
    if (c.value === null && !(c.key === "legalEntity" && entityConflict)) blockers.push({ kind: "core-missing", label: `${c.label} not found`, ref: c.key });
  });
  terms.forEach((t) => {
    if (t.needsDecision) blockers.push({ kind: "conflict", label: `${t.label}: values conflict`, ref: t.key });
  });
  const preSubmitBlockers = [...blockers];
  core.forEach((c) => {
    if (c.value !== null && !c.confirmed) preSubmitBlockers.push({ kind: "core-unconfirmed", label: `Confirm ${c.label.toLowerCase()}`, ref: c.key });
  });
  terms.forEach((t) => {
    if ((t.status === "accepted" || t.status === "offEmail") && !t.confirmed) preSubmitBlockers.push({ kind: "term-unconfirmed", label: `Confirm ${t.label.toLowerCase()}`, ref: t.key });
  });
  if (!decisions.recordComplete) preSubmitBlockers.push({ kind: "record", label: "Confirm the deal record is complete" });

  const dataAccess = core.find((c) => c.key === "dataAccess")?.value;
  const valueField = core.find((c) => c.key === "value")?.value;
  const annual = valueField ? annualUsd(valueField) : null;
  const route =
    dataAccess && annual !== null
      ? routeRequest({ dataAccess: /^yes/i.test(dataAccess), annualValueUsd: annual })
      : null;

  return {
    deal,
    added: live,
    addedIds,
    terms,
    core,
    coverage,
    entityConflict,
    repository,
    contractType,
    suspicious,
    chase,
    blockers: preSubmitBlockers,
    openForLegal: terms.filter((t) => t.goesToLegalOpen),
    typedByHand: core.filter((c) => c.source === "typed").length,
    route,
    citationsVerified,
    termsHeldBack: terms.filter((t) => t.evidenceStatus === "heldBack" || !!t.claimNote).length,
  };
}

/** Sidebar "What's missing": blockers that need data or a decision (D2). */
export function sidebarBlockers(view: DealView): Blocker[] {
  return view.blockers.filter((b) => b.kind === "core-missing" || b.kind === "conflict" || b.kind === "entity");
}

/** Invariant used by the submit gate and tests: no open term carries an agreed value. */
export function buildPayload(view: DealView) {
  const evidenced = view.terms
    .filter((t) => (t.status === "accepted" || t.status === "offEmail") && t.confirmed)
    .map((t) => ({ key: t.key, label: t.label, value: t.value, ownerEntered: t.status === "offEmail", evidence: t.steps.map((s) => ({ messageId: s.messageId, quote: s.quote })) }));
  const open = view.terms
    .filter((t) => !((t.status === "accepted" || t.status === "offEmail") && t.confirmed))
    .map((t) => ({
      key: t.key,
      label: t.label,
      value: null as string | null,
      status: t.status,
      owner: t.openOwner,
      reason: t.resolution?.type === "open" ? t.resolution.reason : reasonFor(t),
    }));
  return {
    dealId: view.deal.id,
    core: Object.fromEntries(view.core.map((c) => [c.key, c.value])),
    evidenced,
    open,
    contractTypeSuggestion: view.contractType.suggestion,
    route: view.route,
    typedByHand: view.typedByHand,
    sources: view.added.map((a) => a.messageId),
  };
}

export function reasonFor(t: TermView): string {
  switch (t.status) {
    case "notNegotiated":
      return "Not discussed in the emails";
    case "conditional":
      return "Condition not resolved in the added material";
    case "proposed":
      return t.claimNote ? "Only one side agreed in writing" : "Proposed, not accepted";
    case "countered":
      return "Countered, no final acceptance";
    case "withdrawn":
      return "Withdrawn, no new agreed value";
    case "heldBack":
      return t.heldBackReason ?? "Held back";
    case "conflict":
      return "Values conflict";
    default:
      return "Open";
  }
}

export type { Route };

/** Forgiving parse of a value field into an annual USD figure (Postel). */
export function annualUsd(v: string): number | null {
  const m = v.replace(/,/g, "").match(/(?:USD|\$)\s*(\d+(?:\.\d+)?)/i) ?? v.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return /per month|a month|monthly/i.test(v) ? n * 12 : n;
}
