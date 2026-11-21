"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  ChevronDown,
  Quote,
  Mail,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Split,
  Flag,
  FileSignature,
  MessageSquareReply,
  Search,
  Bell,
} from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { getDeal } from "@data/index";
import { DEV, LENA } from "@data/deals/people";
import { reasonFor, type TermView } from "@/lib/derive";
import { Button, HonestyChip, Modal, StatusBadge, Tick, cx, fmtDate } from "@/components/ui";
import { SourceMessage } from "./SourceText";
import { SirionMark } from "./SirionMark";

// A mock of the Sirion web app: white top bar, grey canvas, a request form in
// collapsible sections, and documents and a summary on the right. It replaces a
// separate review screen: the owner checks the request where it will live.

export function SirionChrome({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas" data-tour="sirion-app">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-white px-4">
        <span className="flex items-center gap-2 text-h3 text-ink">
          <SirionMark size={22} /> Sirion
        </span>
        <nav className="hidden items-center gap-1 text-small md:flex" aria-hidden>
          {["Home", "Requests", "Contracts", "Reports"].map((n) => (
            <span key={n} className={cx("rounded-chip px-2.5 py-1", n === "Requests" ? "bg-tone-success-bg text-teal" : "text-ink-muted")}>
              {n}
            </span>
          ))}
        </nav>
        <span className="ml-auto hidden h-8 w-[220px] items-center gap-2 rounded-chip border border-line px-2 text-small text-ink-muted lg:flex" aria-hidden>
          <Search size={14} strokeWidth={1.5} /> Search
        </span>
        <HonestyChip kind="mocked" title="Mock of the Sirion web app" />
        <Bell size={17} strokeWidth={1.5} className="hidden text-ink-muted sm:block" aria-hidden />
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs text-white" aria-hidden>
          MS
        </span>
      </header>
      <div className="flex shrink-0 items-center gap-2 px-6 pt-3 text-xs text-ink-muted">
        <button onClick={() => actions.setView("inbox")} className="inline-flex min-h-9 items-center gap-1 rounded-chip pr-2 text-teal hover:underline" data-tour="back-to-outlook">
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden /> Back to Outlook
        </button>
        <span aria-hidden>·</span>
        <span>{crumb}</span>
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-6">{children}</div>
    </div>
  );
}

function Cite({ messageId, quote, label }: { messageId: string; quote?: string; label?: string }) {
  const deal = getDeal("DL-1042");
  const m = deal.messages.find((x) => x.id === messageId)!;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="inline-flex h-7 items-center gap-1 rounded-pill border border-line bg-white px-2 text-xs text-ink-muted hover:border-teal hover:text-teal"
          aria-label={`Source: ${m.kind === "pdf" ? m.filename : `${m.from.name}'s email`}, ${fmtDate(m.date)}`}
        >
          <Quote size={11} strokeWidth={1.75} aria-hidden />
          {label ?? (m.kind === "pdf" ? "Quote PDF" : m.from.name.split(" ")[0])}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="thin-scroll z-50 max-h-[380px] w-[440px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-card border border-line bg-white p-4 shadow-pop fade-in">
          <SourceMessage message={m} quote={quote} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({ title, count, children, tour, defaultOpen = true }: { title: string; count?: string; children: React.ReactNode; tour?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-card bg-white shadow-card" data-tour={tour}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center gap-2 px-5 text-left">
        <span className="text-h3 text-teal">{title}</span>
        {count && <span className="text-xs text-ink-muted">{count}</span>}
        <ChevronDown size={18} strokeWidth={1.5} className={cx("ml-auto text-ink-muted transition-transform", !open && "-rotate-90")} aria-hidden />
      </button>
      {open && <div className="border-t border-line px-5 py-3">{children}</div>}
    </section>
  );
}

function Row({ label, children, cites, tour }: { label: string; children: React.ReactNode; cites?: React.ReactNode; tour?: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-3" data-tour={tour}>
      <span className="text-small text-ink-muted">{label}</span>
      <span className="min-w-0 text-small text-ink">{children}</span>
      {cites && <span className="flex flex-wrap gap-1">{cites}</span>}
    </div>
  );
}

function TermCites({ t }: { t: TermView }) {
  // The final step carries the agreement; show it and the quote that states it.
  const shown = t.steps.filter((s) => s.role !== "statement").slice(-2);
  return (
    <>
      {shown.map((s, i) => (
        <Cite key={i} messageId={s.messageId} quote={s.quote} />
      ))}
    </>
  );
}

export function SirionRequest() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [checked, setChecked] = useState(false);
  const submitted = !!ds.submit.requestId;
  const agreed = view.terms.filter((t) => (t.status === "accepted" || t.status === "offEmail") && t.evidenceStatus !== "conflict");
  const conflicts = view.terms.filter((t) => t.evidenceStatus === "conflict");
  const open = view.terms.filter((t) => t.goesToLegalOpen && t.evidenceStatus !== "conflict");
  const filled = view.core.filter((c) => c.value !== null).length;
  const hardBlockers = view.blockers.filter((b) => b.kind === "conflict" || b.kind === "core-missing" || b.kind === "entity");
  const supplierContact = deal.messages.find((m) => m.from.email.endsWith(deal.supplier.domain))?.from;
  const coreRow = (key: string) => view.core.find((c) => c.key === key)!;

  const field = (key: string, tour?: string) => {
    const c = coreRow(key);
    return (
      <Row
        key={key}
        label={c.label}
        tour={tour ?? `core-${key}`}
        cites={c.source === "ai" ? c.evidence.slice(0, 2).map((e, i) => <Cite key={i} messageId={e.messageId} quote={e.quote} />) : undefined}
      >
        {c.value !== null ? (
          c.value
        ) : (
          <input
            className="min-h-11 w-full rounded-chip border border-line-strong px-2 text-small"
            placeholder="Not in the added emails. Type it here."
            aria-label={c.label}
            onChange={(e) => actions.typeCore(key, e.target.value)}
            data-tour={`type-${key}`}
          />
        )}
      </Row>
    );
  };

  return (
    <SirionChrome crumb={`Requests / ${submitted ? ds.submit.requestId : `New request (${dealId})`}`}>
      <div className="mx-auto max-w-[1180px]">
        {submitted && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-card border border-teal bg-white p-4 shadow-card fade-in" role="status" data-tour="receipt">
            <CheckCircle2 size={26} strokeWidth={1.5} className="text-teal" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-h3 text-ink">
                Request <span className="text-teal">{ds.submit.requestId}</span> sent to {view.route?.queue ?? "Legal"}
              </p>
              <p className="text-small text-ink-muted" data-tour="typed-count">
                {view.typedByHand} of 7 fields typed by hand · {agreed.length} agreed terms with sources · {view.openForLegal.length} open items marked for Legal
              </p>
            </div>
            <Button variant="primary" onClick={() => actions.setView("legal")} icon={<ArrowRight size={16} strokeWidth={1.5} aria-hidden />} data-tour="open-legal">
              See what Legal receives
            </Button>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-card bg-white px-5 py-3 shadow-card">
          <div className="min-w-0 flex-1">
            <h1 className="text-h2 text-ink">{submitted ? "Contract request" : "Create request"}</h1>
            <p className="text-small text-ink-muted">
              {deal.title} · prefilled from {view.coverage.messagesRead} emails and {view.coverage.pdfsRead} PDF in Outlook
            </p>
          </div>
          {!submitted && (
            <>
              <Button variant="secondary" onClick={() => actions.setView("inbox")}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => actions.openSubmit()} disabled={hardBlockers.length > 0} data-tour="submit" title={hardBlockers[0]?.label}>
                Submit request
              </Button>
            </>
          )}
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <Section title="Request type">
              <Row label="Request">New supplier contract</Row>
              <Row label="Contract type" cites={view.contractType.verified ? view.contractType.evidence.map((e, i) => <Cite key={i} messageId={e.messageId} quote={e.quote} />) : undefined}>
                {view.contractType.suggestion}
                {view.repository.matches[0] && <span className="block text-xs text-ink-muted">Existing {view.repository.matches[0].id}, signed {fmtDate(view.repository.matches[0].signed)} {view.repository.matches[0].signed.slice(0, 4)}. Legal decides the paper.</span>}
              </Row>
            </Section>

            <Section title="Basic information" count={`${filled} of 7 filled from email`} tour="basic-info">
              {["legalEntity", "scope", "value", "termStart", "dataAccess", "costCentre"].map((k) => field(k))}
            </Section>

            <Section title="Commercial terms" count={`${agreed.length} agreed${conflicts.length ? `, ${conflicts.length} to settle` : ""}`} tour="commercial">
              {agreed.map((t) => (
                <Row key={t.key} label={t.label} tour={`term-${t.key}`} cites={<TermCites t={t} />}>
                  <span className="flex flex-wrap items-center gap-2">
                    {t.value}
                    <StatusBadge status={t.status} label={t.status === "accepted" && t.resolution?.type === "picked" ? "Picked by you" : "Agreed by both"} />
                  </span>
                </Row>
              ))}
              {conflicts.map((t) => (
                <ConflictRow key={t.key} t={t} />
              ))}
              {open.length > 0 && (
                <div className="mt-2 rounded-chip bg-surface-alt p-3" data-tour="legal-open-list">
                  <p className="flex items-center gap-1.5 text-small text-ink">
                    <Flag size={14} strokeWidth={1.5} className="text-tone-info-fg" aria-hidden /> Goes to Legal as open, not as agreed ({open.length})
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {open.map((t) => (
                      <li key={t.key} className="text-xs text-ink-muted">
                        <span className="text-ink">{t.label}:</span> {reasonFor(t)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            <Section title="Stakeholders">
              {field("requester", "core-requester")}
              <Row label="Contract owner">{deal.owner.name}, Procurement</Row>
              {supplierContact && <Row label="Supplier contact">{supplierContact.name}, {deal.supplier.name}</Row>}
              <Row label="Finance">{LENA.name}, FP&A</Row>
              <Row label="Legal reviewer">
                {DEV.name}
                {view.route && <span className="block text-xs text-ink-muted">Routed to {view.route.queue} by rule {view.route.ruleId}: {view.route.rule}</span>}
              </Row>
            </Section>
          </div>

          <div className="space-y-3">
            <section className="rounded-card bg-white p-4 shadow-card" data-tour="documents" aria-label="Documents">
              <h2 className="text-h3 text-teal">Documents</h2>
              <p className="mt-0.5 text-xs text-ink-muted">Added from Outlook ({view.added.length})</p>
              <ul className="thin-scroll mt-2 max-h-[248px] overflow-y-auto">
                {view.added.map((a) => {
                  const m = deal.messages.find((x) => x.id === a.messageId)!;
                  return (
                    <li key={a.messageId} className="flex items-center gap-2 border-t border-line py-1.5 first:border-t-0">
                      {m.kind === "pdf" ? <FileText size={14} strokeWidth={1.5} className="shrink-0 text-tone-danger-fg" aria-hidden /> : <Mail size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-ink">{m.kind === "pdf" ? m.filename : m.subject.replace(/^RE: /, "")}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          {m.from.name} · {fmtDate(m.date)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-col items-center rounded-chip border border-dashed border-line-strong px-3 py-4 text-center" aria-hidden>
                <UploadCloud size={20} strokeWidth={1.5} className="text-ink-muted" />
                <span className="mt-1 text-xs text-ink-muted">Drag other files here, or browse</span>
              </div>
            </section>

            <section className="rounded-card bg-white p-4 shadow-card" data-tour="summary" aria-label="Request summary">
              <h2 className="text-h3 text-teal">Request summary</h2>
              <dl className="mt-2 space-y-1.5 text-small">
                {[
                  ["Fields filled from email", `${filled} of 7`],
                  ["Typed by hand", String(view.typedByHand)],
                  ["Agreed terms, with sources", String(agreed.length)],
                  ["Conflicts to settle", String(view.terms.filter((t) => t.needsDecision).length)],
                  ["Open items for Legal", String(view.openForLegal.length)],
                  ["Route", view.route ? view.route.queue : "Set when value and data access are known"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-1">
                <HonestyChip kind="ai" />
                <HonestyChip kind="live" title="Citations, contradictions and routing are checked by code in your browser" />
              </div>
            </section>
          </div>
        </div>
      </div>

      <Modal open={ds.submit.status === "confirming" || ds.submit.status === "pending" || ds.submit.status === "failed"} onOpenChange={(o) => !o && actions.cancelSubmit()} title={`Submit ${dealId} to Legal`}>
        <p className="text-small text-ink">
          {agreed.length} agreed terms go with their sources. {view.openForLegal.length} items go as open, with a reason. Nothing was typed by hand.
        </p>
        <Tick tour="confirm-check" className="mt-3 border border-line" checked={checked} onChange={setChecked} label="I checked the prefilled values against their cited emails" />
        {ds.submit.status === "failed" && <p className="mt-2 text-small text-tone-danger-fg">{ds.submit.error} Retry is safe: it will not create a second request.</p>}
        <div className="mt-4 flex justify-between gap-3">
          <Button variant="secondary" onClick={() => actions.cancelSubmit()}>
            Back
          </Button>
          <Button variant="primary" disabled={!checked || ds.submit.status === "pending"} onClick={() => actions.confirmAndSubmit()} data-tour="confirm-submit">
            {ds.submit.status === "pending" ? "Submitting" : "Submit request"}
          </Button>
        </div>
      </Modal>
    </SirionChrome>
  );
}

function ConflictRow({ t }: { t: TermView }) {
  const opts = t.conflict?.options ?? [];
  const resolved = t.resolution;
  const where = (id: string, author: string) => (id.startsWith("pdf") ? "the quote PDF" : `${author}'s email`);
  if (resolved) {
    return (
      <Row label={t.label} tour={`term-${t.key}`} cites={resolved.type === "picked" ? <Cite messageId={resolved.messageId} quote={opts.find((o) => o.messageId === resolved.messageId)?.quote} /> : undefined}>
        <span className="flex flex-wrap items-center gap-2">
          {resolved.type === "open" ? "Not settled" : resolved.value}
          <StatusBadge status={resolved.type === "open" ? "openForLegal" : "accepted"} label={resolved.type === "open" ? "Sent to Legal as open" : "Picked by you"} />
          <button onClick={() => actions.resolveTerm(t.key, undefined)} className="min-h-9 px-1 text-xs text-teal hover:underline">
            Change
          </button>
        </span>
      </Row>
    );
  }
  return (
    <div className="my-2 rounded-chip border border-quartz p-3" data-tour={`conflict-${t.key}`} role="group" aria-label={`${t.label}: values conflict`}>
      <p className="flex flex-wrap items-center gap-2 text-small text-ink">
        <Split size={15} strokeWidth={1.5} className="text-tone-danger-fg" aria-hidden />
        <span>
          <strong className="font-medium">{t.label}:</strong> {opts.map((o) => `${where(o.messageId, o.author)} says ${o.value}`).join(", but ")}.
        </span>
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">Pick the one that holds, or let Legal settle it.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2" data-tour={`options-${t.key}`}>
        {opts.map((o, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <Button size="sm" variant="secondary" onClick={() => actions.resolveTerm(t.key, { type: "picked", value: o.value, messageId: o.messageId })} data-tour={`pick-${t.key}-${i}`}>
              Use {o.value}
            </Button>
            <Cite messageId={o.messageId} quote={o.quote} />
          </span>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            actions.resolveTerm(t.key, {
              type: "open",
              reason: opts.map((o) => `${o.value} (${where(o.messageId, o.author)}, ${fmtDate(o.date)})`).join(" vs ") + ". Confirm which applies.",
              owner: "Legal",
            })
          }
          data-tour={`mark-open-${t.key}`}
          icon={<Flag size={14} strokeWidth={1.5} aria-hidden />}
        >
          Send to Legal as open
        </Button>
      </div>
    </div>
  );
}

export function LegalView() {
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const deal = view.deal;
  const evidenced = view.terms.filter((t) => (t.status === "accepted" || t.status === "offEmail") && t.confirmed);
  const openTerms = view.terms.filter((t) => !evidenced.includes(t));
  return (
    <SirionChrome crumb={`Legal intake / ${ds.submit.requestId}`}>
      <div className="mx-auto max-w-[980px] space-y-3" data-tour="legal">
        <div className="rounded-card bg-white px-5 py-3 shadow-card">
          <h1 className="text-h2 text-ink">Legal intake: {ds.submit.requestId}</h1>
          <p className="text-small text-ink-muted">
            {deal.supplier.legalEntity} · from {deal.owner.name} · {view.route?.queue} · seen by {DEV.name}
          </p>
        </div>
        <section className="rounded-card bg-white p-5 shadow-card" data-tour="legal-evidenced" aria-label="Agreed terms">
          <h2 className="text-h3 text-teal">Agreed by both sides, with sources</h2>
          {evidenced.map((t) => (
            <Row key={t.key} label={t.label} cites={<TermCites t={t} />}>
              {t.value}
            </Row>
          ))}
        </section>
        <section className="rounded-card bg-white p-5 shadow-card" data-tour="legal-open" aria-label="Open items">
          <h2 className="text-h3 text-teal">Open: for Legal to settle</h2>
          {openTerms.map((t) => (
            <Row key={t.key} label={t.label}>
              {t.resolution?.type === "open" ? t.resolution.reason : reasonFor(t)}
              <span className="block text-xs text-ink-muted">Owner: {t.openOwner}</span>
            </Row>
          ))}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white px-5 py-3 shadow-card">
          <p className="text-small text-ink-muted" role="status">
            {ds.legalDecision
              ? ds.legalDecision === "start"
                ? "Recorded: Legal started drafting without asking for context. That is the second half of the north star."
                : "Recorded: Legal asked procurement for more context."
              : "Can Legal start drafting from this alone? Their answer is recorded."}
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => actions.legalDecide("ask")} icon={<MessageSquareReply size={16} strokeWidth={1.5} aria-hidden />} disabled={!!ds.legalDecision}>
              Ask procurement
            </Button>
            <Button variant="primary" onClick={() => actions.legalDecide("start")} icon={<FileSignature size={16} strokeWidth={1.5} aria-hidden />} disabled={!!ds.legalDecision} data-tour="start-drafting">
              Start drafting
            </Button>
          </div>
        </div>
      </div>
    </SirionChrome>
  );
}
