"use client";

// One small external store for the whole app. The UI and the walkthrough call
// the same actions, so the film drives the real product.

import { useSyncExternalStore } from "react";
import { DEALS, EXAMPLES, getDeal } from "@data/index";
import type { AddedItem, Deal, Message, Resolution } from "./types";
import { deriveDeal, emptyDecisions, buildPayload, type OwnerDecisions, type DealView } from "./derive";
import { domainMismatch, domainOf, BUYER_DOMAIN } from "./checks";
import { sirion, hash } from "./submit";

export type View = "inbox" | "sirion" | "legal";
export type Panel = "home" | "agreed" | "open";

export interface AuditEntry {
  at: string;
  who: string;
  action: string;
  detail: string;
}

export interface DealState {
  pickedDealId: string | null;
  pickedVia: "owner" | "suggestion" | "preset" | null;
  ticks: Record<string, boolean>;
  added: AddedItem[];
  decisions: OwnerDecisions;
  reading: number; // 0 = idle, 1..3 = reading steps
  hasRead: boolean;
  pendingWarning: { messageIds: string[]; domains: string[]; via: AddedItem["via"] } | null;
  lastAdd: { added: number; skipped: number } | null;
  audit: AuditEntry[];
  submit: { status: "idle" | "confirming" | "pending" | "failed" | "done"; requestId?: string; attempts: number; error?: string };
  simulateTimeout: boolean;
  legalDecision: "start" | "ask" | null;
}

export interface AppState {
  dealId: string;
  view: View;
  sidebarOpen: boolean;
  openMessageId: string;
  source: { messageId: string; quote?: string } | null;
  chaseFor: string | null;
  atOpen: boolean;
  deals: Record<string, DealState>;
  clock: number; // demo seconds since 18 Nov 2026 09:30
  film: boolean;
  /** Which view the add-in shows: suggestions, or one of its two answers. */
  panel: Panel;
  /** Confirmation after material is added to the deal. */
  toast: { text: string; sub?: string; n: number } | null;
  /** Shown once the reading finishes, so the toast only reports what has happened. */
  pendingToast?: { text: string; sub?: string } | null;
  /** Phone layout only: the Outlook mobile inbox list, or one open conversation. */
  mailScreen?: "list" | "read";
  /** The viewer has opened the Sirion add-in at least once, so the inbox context label can go. */
  addinSeen?: boolean;
}

const DEMO_START = Date.parse("2026-11-18T09:30:00Z");
const KEY = "sirion-i2i-v3";

function freshDeal(d: Deal): DealState {
  const added: AddedItem[] = d.preAdded.map((p) => ({ ...p, via: "pre-added" }));
  const ticks: Record<string, boolean> = { "this-email": true, thread: true };
  threadAttachments(d, d.openMessageId).forEach((m) => (ticks[m.id] = true));
  return {
    pickedDealId: d.startsWithoutDeal ? null : d.id,
    pickedVia: d.startsWithoutDeal ? null : "preset",
    ticks,
    added,
    decisions: emptyDecisions(),
    reading: 0,
    hasRead: added.length > 0,
    pendingWarning: null,
    lastAdd: null,
    audit: d.preAdded.length
      ? [{ at: d.preAdded[0].addedAt, who: d.preAdded[0].addedBy, action: "Added", detail: `${d.preAdded.length} item${d.preAdded.length > 1 ? "s" : ""} to ${d.id}` }]
      : [],
    submit: { status: "idle", attempts: 0 },
    simulateTimeout: false,
    legalDecision: null,
  };
}

function initial(): AppState {
  const main = DEALS[0];
  return {
    dealId: main.id,
    view: "inbox",
    sidebarOpen: false,
    openMessageId: main.openMessageId,
    source: null,
    chaseFor: null,
    atOpen: false,
    deals: Object.fromEntries(DEALS.map((d) => [d.id, freshDeal(d)])),
    clock: 0,
    film: false,
    panel: "home",
    toast: null,
    pendingToast: null,
    mailScreen: "list",
    addinSeen: false,
  };
}

const isPhone = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches;

let state: AppState = initial();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined" && !state.film) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: autosave is best effort */
    }
  }
}

export function hydrateFromSession() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && s.deals && s.deals[DEALS[0].id]) {
        state = { ...s, film: false };
        // A pending submit cannot survive a reload; show it as failed so retry is safe.
        Object.values(state.deals).forEach((d) => {
          if (d.submit.status === "pending") d.submit = { ...d.submit, status: "failed", error: "Interrupted. Retry is safe." };
          d.reading = 0;
        });
        listeners.forEach((l) => l());
      }
    }
  } catch {
    /* ignore */
  }
}

function set(fn: (s: AppState) => AppState) {
  state = fn(state);
  emit();
}

function setDeal(fn: (d: DealState, deal: Deal) => DealState, id = state.dealId) {
  set((s) => ({ ...s, deals: { ...s.deals, [id]: fn(s.deals[id], getDeal(id)) } }));
}

export function getState() {
  return state;
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(initialSnapshot));
}
const initialSnapshot = state;

// ---------- derived

const viewCache = new Map<string, { key: unknown; view: DealView }>();
/**
 * The threads a new deal starts with: the open supplier thread, plus internal threads
 * that name the same supplier. A rival supplier's thread is never included.
 */
export function relatedThreads(deal: Deal) {
  const word = deal.supplier.name.split(" ")[0].toLowerCase();
  return deal.threads.filter((t) => {
    const msgs = t.messageIds.map((id) => deal.messages.find((m) => m.id === id)!);
    const domains = new Set(msgs.map((m) => domainOf(m.from.email)));
    if (domains.has(deal.supplier.domain)) return true;
    const internal = [...domains].every((d) => d === BUYER_DOMAIN);
    return internal && msgs.some((m) => (m.subject + " " + m.body).toLowerCase().includes(word));
  });
}

export function dealView(s: AppState, id = s.dealId): DealView {
  const ds = s.deals[id];
  const cached = viewCache.get(id);
  if (cached && cached.key === ds) return cached.view;
  const view = deriveDeal(getDeal(id), EXAMPLES[id], ds.added, ds.decisions);
  viewCache.set(id, { key: ds, view });
  return view;
}

export function useDealView(): DealView {
  return useApp((s) => dealView(s));
}

export function nowIso(s = state): string {
  return new Date(DEMO_START + s.clock * 1000).toISOString();
}

function tick(seconds = 7) {
  state = { ...state, clock: state.clock + seconds };
}

function log(d: DealState, who: string, action: string, detail: string): DealState {
  return { ...d, audit: [...d.audit, { at: nowIso(), who, action, detail }] };
}

// ---------- helpers

export function threadOf(deal: Deal, messageId: string) {
  return deal.threads.find((t) => t.messageIds.includes(messageId))!;
}

export function threadAttachments(deal: Deal, messageId: string): Message[] {
  const t = threadOf(deal, messageId);
  const ids = new Set<string>();
  t.messageIds.forEach((id) => {
    const m = deal.messages.find((x) => x.id === id)!;
    if (m.kind === "pdf") ids.add(id);
    (m.attachmentIds ?? []).forEach((a) => ids.add(a));
  });
  return Array.from(ids).map((id) => deal.messages.find((m) => m.id === id)!);
}

export function itemsFromTicks(deal: Deal, ds: DealState, openId: string): { ids: string[]; via: AddedItem["via"] } {
  const ids: string[] = [];
  const t = threadOf(deal, openId);
  if (ds.ticks["thread"]) {
    t.messageIds.forEach((id) => {
      const m = deal.messages.find((x) => x.id === id)!;
      if (m.kind === "email") ids.push(id);
    });
  } else if (ds.ticks["this-email"]) ids.push(openId);
  threadAttachments(deal, openId).forEach((m) => {
    if (ds.ticks[m.id]) ids.push(m.id);
  });
  return { ids, via: ds.ticks["thread"] ? "thread" : "this-email" };
}

// ---------- actions

export const actions = {
  reset() {
    viewCache.clear();
    state = { ...initial(), film: state.film };
    emit();
  },
  resetDeal(id = state.dealId) {
    setDeal((_, deal) => freshDeal(deal), id);
    set((s) => ({ ...s, view: "inbox", source: null, chaseFor: null, atOpen: false, panel: "home", toast: null, pendingToast: null, sidebarOpen: false, mailScreen: "list", addinSeen: false, openMessageId: getDeal(id).openMessageId }));
  },
  setFilm(on: boolean) {
    state = { ...state, film: on };
    emit();
  },
  loadDeal(id: string) {
    const deal = getDeal(id);
    set((s) => ({ ...s, dealId: id, view: "inbox", openMessageId: deal.openMessageId, source: null, chaseFor: null, atOpen: false, sidebarOpen: s.sidebarOpen }));
  },
  setView(view: View) {
    set((s) => ({ ...s, view, source: null, toast: null }));
    if (view === "sirion") actions.preselectConflicts();
  },
  /**
   * When the email and the quote disagree, the request opens with the value from the
   * negotiation's last word preselected (the first option), shown as a choice the
   * owner can switch. It is logged as a preselection, not as the owner's decision.
   */
  preselectConflicts() {
    const view = dealView(state);
    view.terms
      .filter((t) => t.needsDecision && !t.resolution && t.conflict?.options[0])
      .forEach((t) => {
        const o = t.conflict!.options[0];
        setDeal((d) =>
          log(
            { ...d, decisions: { ...d.decisions, resolutions: { ...d.decisions.resolutions, [t.key]: { type: "picked", value: o.value, messageId: o.messageId } }, preselected: { ...(d.decisions.preselected ?? {}), [t.key]: true } } },
            "Sirion",
            "Preselected",
            `${t.key}: ${o.value} (the later message); the owner can switch`,
          ),
        );
      });
  },
  /**
   * The first click in the add-in: create the deal in Sirion from the open email, then
   * add its thread and the internal threads about the same supplier.
   */
  createDeal() {
    const deal = getDeal(state.dealId);
    actions.pickDeal(deal.id, "owner");
    const ids = relatedThreads(deal).flatMap((t) => t.messageIds);
    actions.addMessages(ids, "thread", false, true);
    const msgs = ids.map((id) => deal.messages.find((m) => m.id === id)!);
    const pdfs = msgs.filter((m) => m.kind === "pdf").length;
    const emails = msgs.length - pdfs;
    actions.queueToast(`Draft ${deal.id} saved with ${emails} emails and ${pdfs} PDF.`, "Not submitted yet. Review it in Sirion, then submit.");
  },
  /** The toast waits until the reading is done, so it never runs ahead of what has happened. */
  queueToast(text: string, sub?: string) {
    if (state.deals[state.dealId].reading) set((s) => ({ ...s, pendingToast: { text, sub }, toast: null }));
    else set((s) => ({ ...s, pendingToast: null, toast: { text, sub, n: (s.toast?.n ?? 0) + 1 } }));
  },
  flushToast() {
    const p = state.pendingToast;
    if (p) set((s) => ({ ...s, pendingToast: null, toast: { ...p, n: (s.toast?.n ?? 0) + 1 } }));
  },
  setMailScreen(screen: "list" | "read") {
    set((s) => ({ ...s, mailScreen: screen }));
  },
  setPanel(panel: Panel) {
    set((s) => ({ ...s, panel }));
  },
  dismissToast() {
    set((s) => ({ ...s, toast: null }));
  },
  openMessage(id: string) {
    set((s) => ({ ...s, openMessageId: id }));
  },
  toggleSidebar(open?: boolean) {
    set((s) => {
      const next = open ?? !s.sidebarOpen;
      return { ...s, sidebarOpen: next, addinSeen: s.addinSeen || next };
    });
  },
  pickDeal(dealId: string, via: DealState["pickedVia"] = "owner") {
    tick(3);
    setDeal((d) => log({ ...d, pickedDealId: dealId, pickedVia: via }, "Manraj Singh", via === "suggestion" ? "Accepted suggestion" : "Picked deal", dealId));
  },
  clearDeal() {
    setDeal((d) => ({ ...d, pickedDealId: null, pickedVia: null }));
  },
  setTick(key: string, on: boolean) {
    setDeal((d) => {
      const ticks = { ...d.ticks, [key]: on };
      if (key === "thread" && on) ticks["this-email"] = true;
      if (key === "this-email" && !on) ticks["thread"] = false;
      return { ...d, ticks };
    });
  },
  addTicked() {
    const deal = getDeal(state.dealId);
    const ds = state.deals[state.dealId];
    const { ids, via } = itemsFromTicks(deal, ds, state.openMessageId);
    actions.addMessages(ids, via);
  },
  addThread(threadId: string) {
    const deal = getDeal(state.dealId);
    const t = deal.threads.find((x) => x.id === threadId)!;
    set((s) => ({ ...s, atOpen: false }));
    actions.addMessages(t.messageIds, "@");
  },
  setAtOpen(open: boolean) {
    set((s) => ({ ...s, atOpen: open }));
  },
  /** Adds messages. Domain mismatch pauses for a warning first. Nothing is attached without this click. */
  addMessages(ids: string[], via: AddedItem["via"], force = false, quiet = false) {
    const deal = getDeal(state.dealId);
    const ds = state.deals[state.dealId];
    if (!ds.pickedDealId) return;
    const msgs = ids.map((id) => deal.messages.find((m) => m.id === id)!).filter(Boolean);
    const mismatched = msgs.filter((m) => domainMismatch(m, deal));
    if (mismatched.length && !force) {
      setDeal((d) => ({ ...d, pendingWarning: { messageIds: ids, domains: Array.from(new Set(mismatched.map((m) => m.from.email.split("@")[1]))), via } }));
      return;
    }
    tick(5);
    const existing = new Set(ds.added.filter((a) => !a.removed).map((a) => a.messageId));
    const toAdd = ids.filter((id) => !existing.has(id));
    const skipped = ids.length - toAdd.length;
    const at = nowIso();
    setDeal((d) => {
      const kept = d.added.filter((a) => !(toAdd.includes(a.messageId) && a.removed));
      const added = [...kept, ...toAdd.map((id) => ({ messageId: id, addedBy: "Manraj Singh", addedAt: at, via }))];
      let next: DealState = { ...d, added, pendingWarning: null, lastAdd: { added: toAdd.length, skipped }, reading: toAdd.length ? 1 : 0 };
      next = log(next, "Manraj Singh", "Added", `${toAdd.length} item${toAdd.length === 1 ? "" : "s"} to ${d.pickedDealId} (${via})${skipped ? `, ${skipped} already added` : ""}; content hash ${hash(toAdd.join(","))}`);
      return next;
    });
    if (toAdd.length) {
      const pdfs = toAdd.filter((id) => deal.messages.find((m) => m.id === id)?.kind === "pdf").length;
      const emails = toAdd.length - pdfs;
      const parts = [emails ? `${emails} email${emails === 1 ? "" : "s"}` : "", pdfs ? `${pdfs} PDF${pdfs === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");
      if (!quiet) actions.queueToast(`Added ${parts} to the draft request`, "Not submitted yet.");
      actions.runReading();
    }
  },
  cancelWarning() {
    setDeal((d) => ({ ...d, pendingWarning: null }));
  },
  confirmWarning() {
    const w = state.deals[state.dealId].pendingWarning;
    if (w) actions.addMessages(w.messageIds, w.via, true);
  },
  /** The walkthrough steps the reading itself, so the film never races a timer. */
  setReading(n: number) {
    setDeal((d) => ({ ...d, reading: n }));
  },
  runReading() {
    if (state.film) return;
    const id = state.dealId;
    const stepMs = state.film ? 500 : 500;
    [2, 3].forEach((n, i) =>
      setTimeout(() => setDeal((d) => (d.reading ? { ...d, reading: n } : d), id), stepMs * (i + 1)),
    );
    setTimeout(() => {
      setDeal((d) => ({ ...d, reading: 0, hasRead: true }), id);
      actions.flushToast();
    }, stepMs * 3);
  },
  /** For the walkthrough's seek: finish any reading instantly. */
  finishReading() {
    Object.keys(state.deals).forEach((id) => {
      if (state.deals[id].reading) setDeal((d) => ({ ...d, reading: 0, hasRead: true }), id);
    });
    actions.flushToast();
  },
  removeItem(messageId: string) {
    tick(4);
    setDeal((d) =>
      log({ ...d, added: d.added.map((a) => (a.messageId === messageId ? { ...a, removed: true } : a)) }, "Manraj Singh", "Removed", messageId),
    );
  },
  restoreItem(messageId: string) {
    setDeal((d) => log({ ...d, added: d.added.map((a) => (a.messageId === messageId ? { ...a, removed: false } : a)) }, "Manraj Singh", "Restored", messageId));
  },
  /** Open a cited sentence in the mail reading pane. PDFs open under the email that carried them. */
  cite(messageId: string, quote?: string) {
    const m = getDeal(state.dealId).messages.find((x) => x.id === messageId);
    const phone = isPhone();
    set((s) => ({ ...s, view: "inbox", source: { messageId, quote }, openMessageId: m?.kind === "pdf" && m.parentId ? m.parentId : messageId, mailScreen: "read", sidebarOpen: phone ? false : s.sidebarOpen }));
  },
  selectSource(messageId: string, quote?: string) {
    set((s) => ({ ...s, source: { messageId, quote } }));
  },
  // ---- owner decisions
  confirmCore(key: string, on: boolean) {
    setDeal((d) => ({ ...d, decisions: { ...d.decisions, confirmedCore: { ...d.decisions.confirmedCore, [key]: on } } }));
  },
  typeCore(key: string, value: string | undefined) {
    setDeal((d) => ({
      ...d,
      decisions: {
        ...d.decisions,
        typedCore: { ...d.decisions.typedCore, [key]: value },
        confirmedCore: { ...d.decisions.confirmedCore, [key]: false },
      },
    }));
  },
  /** The owner corrects a value Sirion filled in. The change is logged with the old value. */
  editCore(key: string, value: string) {
    const old = dealView(state).core.find((c) => c.key === key)?.value ?? "";
    if (value.trim() === "" || value === old) return;
    tick(5);
    setDeal((d) =>
      log(
        { ...d, decisions: { ...d.decisions, typedCore: { ...d.decisions.typedCore, [key]: value }, confirmedCore: { ...d.decisions.confirmedCore, [key]: false } } },
        "Manraj Singh",
        "Edited",
        `${key}: "${old}" to "${value}"`,
      ),
    );
  },
  undoEditCore(key: string) {
    setDeal((d) => log({ ...d, decisions: { ...d.decisions, typedCore: { ...d.decisions.typedCore, [key]: undefined } } }, "Manraj Singh", "Undid edit", key));
  },
  editTerm(key: string, value: string) {
    const old = dealView(state).terms.find((t) => t.key === key)?.value ?? "";
    if (value.trim() === "" || value === old) return;
    tick(5);
    setDeal((d) =>
      log(
        { ...d, decisions: { ...d.decisions, resolutions: { ...d.decisions.resolutions, [key]: { type: "offEmail", value, note: "Edited by the owner in Sirion" } }, confirmedTerms: { ...d.decisions.confirmedTerms, [key]: false } } },
        "Manraj Singh",
        "Edited",
        `${key}: "${old}" to "${value}"`,
      ),
    );
  },
  undoEditTerm(key: string) {
    setDeal((d) => log({ ...d, decisions: { ...d.decisions, resolutions: { ...d.decisions.resolutions, [key]: undefined } } }, "Manraj Singh", "Undid edit", key));
  },
  pickCore(key: string, value: string) {
    setDeal((d) => log({ ...d, decisions: { ...d.decisions, pickedCore: { ...d.decisions.pickedCore, [key]: value } } }, "Manraj Singh", "Picked value", `${key}: ${value}`));
  },
  confirmTerm(key: string, on: boolean) {
    setDeal((d) => ({ ...d, decisions: { ...d.decisions, confirmedTerms: { ...d.decisions.confirmedTerms, [key]: on } } }));
  },
  resolveTerm(key: string, resolution: Resolution | undefined) {
    tick(6);
    setDeal((d) =>
      log(
        { ...d, decisions: { ...d.decisions, resolutions: { ...d.decisions.resolutions, [key]: resolution }, confirmedTerms: { ...d.decisions.confirmedTerms, [key]: false }, preselected: { ...(d.decisions.preselected ?? {}), [key]: false } } },
        "Manraj Singh",
        resolution ? (resolution.type === "open" ? "Marked open for Legal" : resolution.type === "picked" ? "Resolved with evidence" : "Logged term agreed on a call") : "Cleared resolution",
        `${key}${resolution && resolution.type === "open" ? `: ${resolution.reason}` : resolution && "value" in resolution ? `: ${resolution.value}` : ""}`,
      ),
    );
  },
  setRecordComplete(on: boolean) {
    setDeal((d) => ({ ...d, decisions: { ...d.decisions, recordComplete: on } }));
  },
  openChase(termKey: string | null) {
    set((s) => ({ ...s, chaseFor: termKey }));
  },
  // ---- submit
  openSubmit() {
    setDeal((d) => ({ ...d, submit: { ...d.submit, status: "confirming" } }));
  },
  cancelSubmit() {
    setDeal((d) => ({ ...d, submit: { ...d.submit, status: d.submit.requestId ? "done" : "idle" } }));
  },
  setSimulateTimeout(on: boolean) {
    setDeal((d) => ({ ...d, simulateTimeout: on }));
  },
  async submit() {
    const id = state.dealId;
    const ds = state.deals[id];
    if (ds.submit.status === "pending") return; // double clicks do nothing
    const view = dealView(state, id);
    if (view.blockers.length) return; // the gate
    const payload = buildPayload(view);
    const fail = ds.simulateTimeout && ds.submit.attempts === 0;
    setDeal((d) => ({ ...d, submit: { ...d.submit, status: "pending", attempts: d.submit.attempts + 1, error: undefined } }), id);
    try {
      const req = await sirion.submit(`${id}-intake`, id, payload, { simulateTimeout: fail });
      tick(4);
      setDeal((d) => log({ ...d, submit: { ...d.submit, status: "done", requestId: req.requestId } }, "Manraj Singh", "Submitted", `${req.requestId} (attempt ${d.submit.attempts}, idempotency key ${id}-intake)`), id);
      set((s) => ({ ...s, view: s.dealId === id ? "sirion" : s.view }));
    } catch (e) {
      setDeal((d) => log({ ...d, submit: { ...d.submit, status: "failed", error: (e as Error).message } }, "System", "Submit failed", (e as Error).message), id);
    }
  },
  /**
   * The single owner checkpoint on the Sirion screen: ticking "I checked these
   * against the cited emails" confirms every prefilled field and every agreed
   * term, then submits. Conflicts must already be resolved (the gate still runs).
   */
  async confirmAndSubmit() {
    const view = dealView(state);
    view.core.forEach((c) => c.value !== null && actions.confirmCore(c.key, true));
    view.terms.forEach((t) => (t.status === "accepted" || t.status === "offEmail") && actions.confirmTerm(t.key, true));
    actions.setRecordComplete(true);
    setDeal((d) => log(d, "Manraj Singh", "Confirmed", "Checked prefilled fields and agreed terms against their citations"));
    await actions.submit();
  },
  legalDecide(decision: "start" | "ask") {
    tick(30);
    setDeal((d) => log({ ...d, legalDecision: decision }, "Dev Malhotra (Legal)", decision === "start" ? "Started drafting" : "Asked procurement", d.submit.requestId ?? ""));
  },
};

export function sessionCounters(s: AppState) {
  const ids = Object.keys(s.deals);
  let typed = 0;
  let held = 0;
  let cites = 0;
  let submitted = 0;
  let legalStart = 0;
  let legalAsk = 0;
  ids.forEach((id) => {
    const ds = s.deals[id];
    const touched = ds.added.some((a) => a.via !== "pre-added") || ds.submit.requestId;
    if (!touched) return;
    const v = dealView(s, id);
    typed += v.typedByHand;
    held += v.termsHeldBack;
    cites += v.citationsVerified;
    if (ds.submit.requestId) submitted++;
    if (ds.legalDecision === "start") legalStart++;
    if (ds.legalDecision === "ask") legalAsk++;
  });
  return { typed, held, cites, submitted, legalStart, legalAsk };
}
