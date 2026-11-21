"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Quote, Mail, UploadCloud, Check, ArrowLeft, Search, Bell, RotateCcw } from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { getDeal } from "@data/index";
import type { TermView } from "@/lib/derive";
import { Button, cx, fmtDate } from "@/components/ui";
import { SourceMessage } from "./SourceText";
import { SirionMark } from "./SirionMark";

// A mock of the Sirion web app: solid top bar, grey canvas, a request form in
// collapsible sections, documents and the submit panel on the right. The owner
// checks the request where it will live, already filled from Outlook.

export function SirionChrome({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  return (
    <div className="sirion-enter flex h-full min-h-0 flex-col bg-canvas" data-tour="sirion-app">
      <header className="flex h-12 shrink-0 items-center gap-5 bg-teal px-4 text-white">
        <span className="flex items-center gap-2 text-h3 font-medium">
          <SirionMark size={22} inverse /> Sirion
        </span>
        <nav className="hidden items-center gap-1 text-small md:flex" aria-hidden>
          {["Home", "Requests", "Contracts", "Reports"].map((n) => (
            <span key={n} className={cx("rounded-chip px-2.5 py-1", n === "Requests" ? "bg-white text-teal" : "text-white")}>
              {n}
            </span>
          ))}
        </nav>
        <span className="ml-auto hidden h-8 w-[220px] items-center gap-2 rounded-chip bg-white px-2 text-small text-ink-muted lg:flex" aria-hidden>
          <Search size={14} strokeWidth={1.5} /> Search
        </span>
        <span className="rounded-pill border border-white px-2 text-xs leading-5" title="Mock of the Sirion web app">
          Mock
        </span>
        <Bell size={17} strokeWidth={1.5} className="hidden sm:block" aria-hidden />
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-medium text-teal" aria-hidden>
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

/** One quiet source button per value: click to read the sentence it came from. */
export function Source({ messageId, quote }: { messageId: string; quote?: string }) {
  const m = getDeal("DL-1042").messages.find((x) => x.id === messageId)!;
  const who = m.kind === "pdf" ? "the quote PDF" : `${m.from.name}'s email`;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-teal" aria-label={`Source: ${who}, ${fmtDate(m.date)}`} title={`From ${who}`}>
          <Quote size={14} strokeWidth={1.75} aria-hidden />
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

function Section({ title, children, tour }: { title: string; children: React.ReactNode; tour?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-card bg-white shadow-card" data-tour={tour}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center gap-2 px-5 text-left">
        <span className="h-4 w-1 rounded-pill bg-teal" aria-hidden />
        <span className="text-h3 font-medium text-ink">{title}</span>
        <ChevronDown size={18} strokeWidth={1.5} className={cx("ml-auto text-ink-muted transition-transform", !open && "-rotate-90")} aria-hidden />
      </button>
      {open && <div className="px-5 pb-3">{children}</div>}
    </section>
  );
}

function Row({ label, children, source, tour }: { label: string; children: React.ReactNode; source?: React.ReactNode; tour?: string }) {
  return (
    <div className="grid min-h-11 grid-cols-[1fr_32px] items-center gap-x-3 border-t border-line py-1.5 sm:grid-cols-[170px_1fr_32px]" data-tour={tour}>
      <span className="col-span-2 text-xs text-ink-muted sm:col-span-1 sm:text-small">{label}</span>
      <span className="min-w-0 text-small text-ink">{children}</span>
      <span>{source}</span>
    </div>
  );
}

/** The step that settled a term: its last offer, acceptance or resolution. */
const settling = (t: TermView) => [...t.steps].reverse().find((s) => s.role !== "statement") ?? t.steps[0];

export function SirionRequest() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [checked, setChecked] = useState(false);
  const submitted = !!ds.submit.requestId;
  const term = (k: string) => view.terms.find((t) => t.key === k)!;
  const core = (k: string) => view.core.find((c) => c.key === k)!;
  const filled = view.core.filter((c) => c.value !== null).length;
  const conflict = view.terms.find((t) => t.needsDecision);
  const blocked = view.blockers.some((b) => b.kind === "conflict" || b.kind === "core-missing" || b.kind === "entity");

  if (submitted) return <Created />;

  const field = (key: string, label?: string) => {
    const c = core(key);
    return (
      <Row key={key} label={label ?? c.label} tour={`core-${key}`} source={c.source === "ai" && c.evidence[0] ? <Source messageId={c.evidence[0].messageId} quote={c.evidence[0].quote} /> : undefined}>
        {c.value ?? (
          <input className="min-h-10 w-full rounded-chip border border-line-strong px-2 text-small" placeholder="Not in the emails. Type it here." aria-label={c.label} onChange={(e) => actions.typeCore(key, e.target.value)} data-tour={`type-${key}`} />
        )}
      </Row>
    );
  };

  const termRow = (k: string) => {
    const t = term(k);
    if (t.evidenceStatus === "conflict") return <ConflictRow key={k} t={t} />;
    const agreed = t.status === "accepted" || t.status === "offEmail";
    const s = agreed ? settling(t) : undefined;
    return (
      <Row key={k} label={t.label} tour={`term-${k}`} source={s ? <Source messageId={s.messageId} quote={s.quote} /> : undefined}>
        {agreed ? t.value : <span className="text-ink-muted">Flagged for Legal</span>}
      </Row>
    );
  };

  const groups = deal.threads
    .map((t) => ({ t, n: t.messageIds.filter((id) => view.addedIds.has(id)).length, pdf: t.messageIds.some((id) => view.addedIds.has(id) && id.startsWith("pdf")) }))
    .filter((g) => g.n > 0);

  return (
    <SirionChrome crumb={`Requests / New request (${dealId})`}>
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-3 flex items-center gap-3 px-1 py-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-h1 text-ink">New intake request</h1>
            <p className="text-small text-ink-muted">Filled in from Outlook. Check it, then submit.</p>
          </div>
          <Button variant="secondary" onClick={() => actions.setView("inbox")}>
            Cancel
          </Button>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Section title="Request type">
              <Row label="Contract type" source={view.contractType.verified && view.contractType.evidence[0] ? <Source messageId={view.contractType.evidence[0].messageId} quote={view.contractType.evidence[0].quote} /> : undefined}>
                {view.contractType.suggestion}
              </Row>
            </Section>
            <Section title="Basic information" tour="basic-info">
              {field("legalEntity", "Supplier")}
              {field("scope")}
              {field("value", "Annual value")}
              {field("termStart", "Term")}
              {field("costCentre")}
            </Section>
            <Section title="Commercial terms" tour="commercial">
              {["uplift", "sla", "payment"].map(termRow)}
            </Section>
            <Section title="Stakeholders">
              {field("requester")}
              <Row label="Contract owner">{deal.owner.name}, Procurement</Row>
            </Section>
          </div>

          <div className="space-y-3 lg:sticky lg:top-0">
            <section className="rounded-card bg-white p-4 shadow-card" data-tour="documents" aria-label="Documents">
              <h2 className="text-h3 font-medium text-ink">Documents</h2>
              <ul className="mt-2 space-y-2">
                {groups.map(({ t, n, pdf }) => (
                  <li key={t.id} className="flex items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-chip bg-surface-alt text-teal">
                      <Mail size={15} strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small text-ink">{t.subject}</span>
                      <span className="block text-xs text-ink-muted">
                        {n - (pdf ? 1 : 0)} email{n - (pdf ? 1 : 0) === 1 ? "" : "s"}
                        {pdf ? " and the quote PDF" : ""} · from Outlook
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-chip border border-dashed border-line-strong py-3 text-xs text-ink-muted" aria-hidden>
                <UploadCloud size={16} strokeWidth={1.5} /> Drop other files here
              </div>
            </section>

            <section className="rounded-card bg-white p-4 shadow-card" data-tour="summary" aria-label="Submit">
              <dl className="space-y-1.5 text-small">
                {[
                  ["Filled from email", `${filled} of 7`],
                  ["Typed by hand", String(view.typedByHand)],
                  ["Flagged for Legal", String(view.openForLegal.length + (conflict ? 1 : 0))],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-line pt-3 text-small text-ink" data-tour="confirm-check">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand-primary)]" />
                I checked these values against their sources
              </label>
              <Button
                variant="primary"
                className="mt-3 w-full"
                disabled={blocked || !checked || ds.submit.status === "pending"}
                onClick={() => actions.confirmAndSubmit()}
                data-tour="submit"
                title={blocked ? "Pick the payment terms first" : !checked ? "Tick the check first" : undefined}
              >
                {ds.submit.status === "pending" ? "Submitting" : "Submit request"}
              </Button>
              {ds.submit.status === "failed" && <p className="mt-2 text-xs text-tone-danger-fg">{ds.submit.error} Retry is safe.</p>}
            </section>
          </div>
        </div>
      </div>
    </SirionChrome>
  );
}

function ConflictRow({ t }: { t: TermView }) {
  const opts = t.conflict?.options ?? [];
  const picked = t.resolution?.type === "picked" ? t.resolution.value : null;
  const where = (id: string, author: string) => (id.startsWith("pdf") ? "Quote PDF" : `${author.split(" ")[0]}'s email`);
  return (
    <div className="border-t border-line py-2.5 sm:grid sm:grid-cols-[170px_1fr] sm:gap-x-3" data-tour={`term-${t.key}`}>
      <span className="text-small text-ink-muted">{t.label}</span>
      <div>
        {!picked && <p className="mb-1.5 text-small text-ink">The email and the quote disagree. Which holds?</p>}
        <div className="inline-flex rounded-button border border-line-strong p-0.5" role="radiogroup" aria-label={`${t.label}: pick a value`} data-tour={`options-${t.key}`}>
          {opts.map((o, i) => {
            const on = picked === o.value;
            return (
              <button
                key={i}
                role="radio"
                aria-checked={on}
                onClick={() => actions.resolveTerm(t.key, { type: "picked", value: o.value, messageId: o.messageId })}
                className={cx("flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-small", on ? "bg-teal text-white" : "text-ink hover:bg-surface-alt")}
                data-tour={`pick-${t.key}-${i}`}
              >
                {on && <Check size={14} strokeWidth={2} aria-hidden />}
                {o.value}
                <span className={cx("text-xs", on ? "text-white" : "text-ink-muted")}>· {where(o.messageId, o.author)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The end of the story: the intake request exists in Sirion. */
function Created() {
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const value = view.core.find((c) => c.key === "value")?.value;
  return (
    <SirionChrome crumb={`Requests / ${ds.submit.requestId}`}>
      <div className="flex min-h-full items-center justify-center py-6">
        <section className="w-full max-w-[560px] rounded-card bg-white p-8 text-center shadow-card fade-in" role="status" data-tour="receipt">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white">
            <Check size={28} strokeWidth={2} aria-hidden />
          </span>
          <h1 className="mt-4 text-h1 text-ink">Intake request created</h1>
          <p className="mt-1 text-h3 font-medium text-teal">{ds.submit.requestId}</p>
          <p className="mt-2 text-small text-ink-muted">
            {view.deal.supplier.name} · {value} · routed to {view.route?.queue ?? "Legal"}
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5" data-tour="typed-count">
            {[
              [`${view.core.filter((c) => c.value !== null).length}/7`, "fields from email"],
              [String(view.typedByHand), "typed by hand"],
              [String(view.openForLegal.length), "flagged for Legal"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="text-h1 text-ink">{n}</dt>
                <dd className="text-xs text-ink-muted">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => actions.setView("inbox")} icon={<ArrowLeft size={15} strokeWidth={1.5} aria-hidden />}>
              Back to Outlook
            </Button>
            <Button variant="ghost" onClick={() => actions.resetDeal()} icon={<RotateCcw size={15} strokeWidth={1.5} aria-hidden />}>
              Start again
            </Button>
          </div>
        </section>
      </div>
    </SirionChrome>
  );
}
