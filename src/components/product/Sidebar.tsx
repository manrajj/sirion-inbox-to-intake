"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  CircleDot,
  ChevronDown,
  Search,
  Plus,
  X,
  AtSign,
  Mail,
  FileText,
  Check,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  FolderSearch,
  ListChecks,
  ClipboardList,
  PenLine,
  Info,
} from "lucide-react";
import { actions, useApp, useDealView, threadOf, threadAttachments, itemsFromTicks } from "@/lib/store";
import { getDeal, EXAMPLES } from "@data/index";
import { verifySuggestion, domainOf } from "@/lib/checks";
import { messageText, sidebarBlockers } from "@/lib/derive";
import { Button, HonestyChip, StatusBadge, Tick, cx, fmtDate, SuspiciousBadge } from "@/components/ui";

const READ_STEPS = ["Grouping threads", "Reading the quote", "Checking existing agreements"];

export function Sidebar() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const openId = useApp((s) => s.openMessageId);
  const atOpen = useApp((s) => s.atOpen);
  const view = useDealView();
  const deal = getDeal(dealId);
  const byId = useMemo(() => new Map(deal.messages.map((m) => [m.id, m])), [deal]);
  const open = byId.get(openId)!;
  const thread = threadOf(deal, openId);
  const attachments = threadAttachments(deal, openId);
  const threadEmails = thread.messageIds.filter((id) => byId.get(id)!.kind === "email");

  const ticked = itemsFromTicks(deal, ds, openId).ids;
  const addedIds = view.addedIds;
  const unaddedTicked = ticked.filter((id) => !addedIds.has(id));
  const blockers = sidebarBlockers(view);
  const submitted = !!ds.submit.requestId;
  const hasMaterial = view.added.length > 0;

  let primary: { label: string; onClick: () => void; tour: string };
  if (!ds.pickedDealId) primary = { label: "Add to Sirion", onClick: () => document.getElementById("deal-picker")?.click(), tour: "add-to-sirion" };
  else if (submitted) primary = { label: `View request ${ds.submit.requestId}`, onClick: () => actions.setView("receipt"), tour: "submit-request" };
  else if (unaddedTicked.length) primary = { label: "Add to Sirion", onClick: () => actions.addTicked(), tour: "add-to-sirion" };
  else if (blockers.length) primary = { label: `Review in Sirion (${blockers.length} to resolve)`, onClick: () => actions.setView("review"), tour: "review-in-sirion" };
  else primary = { label: "Submit request", onClick: () => actions.setView("review"), tour: "submit-request" };

  return (
    <aside
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-[8px] bg-surface-alt shadow-card md:w-[360px]"
      aria-label="Sirion deal sidebar"
      data-tour="sidebar"
    >
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-1.5">
        <span className="flex items-center gap-2 text-h3 text-ink">
          <CircleDot size={16} strokeWidth={1.5} className="text-teal" aria-hidden /> Sirion
        </span>
        <span className="flex items-center gap-1">
          <HonestyChip kind="mocked" title="Mock of the Outlook and Gmail add-in" />
          <button onClick={() => actions.toggleSidebar(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-button text-ink-muted hover:bg-white" aria-label="Close sidebar">
            <X size={16} strokeWidth={1.5} />
          </button>
        </span>
      </header>

      <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-3">
        <DealPicker />

        {!ds.pickedDealId && <Suggestions />}

        {ds.pickedDealId && (
          <>
            {/* Context chips */}
            <section aria-label="What to add" className="rounded-card border border-line bg-white p-2" data-tour="context-chips">
              <Tick
                tour="tick-this-email"
                checked={!!ds.ticks["this-email"]}
                onChange={(v) => actions.setTick("this-email", v)}
                label={<span className="flex items-center gap-1.5"><Mail size={14} strokeWidth={1.5} aria-hidden /> This email</span>}
                sub={addedIds.has(openId) ? "Already added" : `${open.from.name}, ${fmtDate(open.date)}`}
              />
              <Tick
                tour="tick-thread"
                checked={!!ds.ticks["thread"]}
                onChange={(v) => actions.setTick("thread", v)}
                label={`The thread (${threadEmails.length} email${threadEmails.length > 1 ? "s" : ""})`}
                sub={threadEmails.every((id) => addedIds.has(id)) ? "Already added" : thread.subject}
              />
              {attachments.map((a) => (
                <Tick
                  key={a.id}
                  tour={`tick-${a.id}`}
                  checked={!!ds.ticks[a.id]}
                  onChange={(v) => actions.setTick(a.id, v)}
                  label={<span className="flex items-center gap-1.5"><FileText size={14} strokeWidth={1.5} aria-hidden /> <span className="truncate">{a.filename}</span></span>}
                  sub={addedIds.has(a.id) ? "Already added" : a.readable === false ? "Cannot be read in v1" : "Attachment"}
                />
              ))}
              <p className="px-2 pt-1 text-xs text-ink-muted">Nothing is read until you add it.</p>
            </section>

            {ds.pendingWarning && <MismatchWarning />}
            {ds.lastAdd && ds.lastAdd.skipped > 0 && !ds.reading && (
              <p className="rounded-chip bg-white px-3 py-2 text-xs text-ink-muted" role="status">
                {ds.lastAdd.skipped} item{ds.lastAdd.skipped > 1 ? "s" : ""} already added, skipped by message ID.
              </p>
            )}

            {ds.reading > 0 ? (
              <Reading step={ds.reading} />
            ) : (
              <>
                {view.suspicious.length > 0 && (
                  <section className="rounded-card border-2 border-quartz bg-white p-3" data-tour="suspicious" aria-label="Suspicious instruction">
                    <div className="mb-1 flex items-center gap-2">
                      <SuspiciousBadge />
                      <HonestyChip kind="ai" />
                      <HonestyChip kind="live" />
                    </div>
                    <p className="text-small text-ink">Supplier text contains instructions to the AI. They were ignored.</p>
                    <blockquote className="mt-2 border-l-2 border-quartz pl-2 text-xs text-ink-muted">“{view.suspicious[0].quote}”</blockquote>
                    <p className="mt-2 text-xs text-ink">Route stays {view.route ? `${view.route.ruleId}: ${view.route.queue}` : "set by Legal's rules"}. Supplier text is evidence, never an instruction.</p>
                  </section>
                )}
                <Agreed hasMaterial={hasMaterial} />
                <Missing hasMaterial={hasMaterial} />
                <Existing hasMaterial={hasMaterial} />
              </>
            )}

            {/* Add to Sirion: the one primary button */}
            <section className="rounded-card border border-line bg-white p-3" aria-label="Add to Sirion">
              <div className="mb-2 flex items-center gap-2 text-small text-ink">
                <PenLine size={15} strokeWidth={1.5} className="text-teal" aria-hidden />
                {submitted ? "Request submitted" : unaddedTicked.length ? `Add ${unaddedTicked.length} item${unaddedTicked.length > 1 ? "s" : ""} to ${ds.pickedDealId}` : blockers.length ? "Resolve before you submit" : "Ready to submit"}
              </div>
              <Button variant="primary" className="w-full" data-tour={primary.tour} onClick={primary.onClick} disabled={ds.reading > 0}>
                {primary.label}
              </Button>
            </section>

            {/* @ input */}
            <AtInput open={atOpen} />

            {/* Added items */}
            <AddedItems />
          </>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------- Deal picker

function DealPicker() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const openId = useApp((s) => s.openMessageId);
  const deal = getDeal(dealId);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const msg = deal.messages.find((m) => m.id === openId)!;
  const options = [
    { id: deal.id, title: deal.title, available: true },
    ...(deal.otherDeals ?? []).filter((o) => o.id !== deal.id).map((o) => ({ id: o.id, title: o.title, available: false })),
  ].filter((o) => !q || `${o.id} ${o.title}`.toLowerCase().includes(q.toLowerCase()));

  const picked = ds.pickedDealId;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="rounded-card border border-line bg-white p-2" data-tour="deal-picker">
        <div className="px-2 pb-1 text-xs text-ink-muted">Deal</div>
        <Popover.Trigger asChild>
          <button id="deal-picker" className="flex min-h-11 w-full items-center gap-2 rounded-chip border border-line px-3 text-left hover:bg-surface-alt" aria-label="Pick a deal">
            {picked ? (
              <>
                <span className="text-small text-teal">{picked}</span>
                <span className="flex-1 truncate text-small text-ink">{deal.title}</span>
              </>
            ) : (
              <span className="flex-1 text-small text-ink-muted">No deal picked</span>
            )}
            <ChevronDown size={16} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-[336px] rounded-card border border-line bg-white p-2 fade-in" data-tour="deal-picker-menu">
          <label className="flex min-h-11 items-center gap-2 rounded-chip border border-line px-3">
            <Search size={15} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your deals" className="w-full bg-transparent text-small outline-none" aria-label="Search your deals" />
          </label>
          <ul className="mt-2 max-h-60 overflow-y-auto">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  disabled={!o.available}
                  onClick={() => {
                    actions.pickDeal(o.id);
                    setOpen(false);
                  }}
                  data-tour={`pick-${o.id}`}
                  className="flex min-h-11 w-full items-center gap-2 rounded-chip px-3 text-left text-small hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-teal">{o.id}</span>
                  <span className="flex-1 truncate text-ink">{o.title}</span>
                  {!o.available && <span className="text-xs text-ink-muted">no demo data</span>}
                  {o.id === picked && <Check size={15} strokeWidth={1.5} className="text-teal" aria-label="Picked" />}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              actions.pickDeal(deal.id, "owner");
              setOpen(false);
            }}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-chip border-t border-line px-3 text-left text-small text-teal hover:bg-surface-alt"
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden />
            <span className="truncate">New deal: {deal.supplier.name}, “{msg.subject.replace(/^RE:\s*/i, "")}”</span>
          </button>
          <p className="px-3 pt-1 text-xs text-ink-muted">Supplier and title prefilled from this email. In the prototype, a new deal uses this demo's data.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Suggestions() {
  const dealId = useApp((s) => s.dealId);
  const openId = useApp((s) => s.openMessageId);
  const deal = getDeal(dealId);
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const open = byId.get(openId)!;
  const text = messageText(open, byId);
  const results = EXAMPLES[dealId].dealMatch.suggestions
    .map((s) => {
      const cand = s.dealId === deal.id ? { supplierDomain: deal.supplier.domain } : deal.otherDeals?.find((o) => o.id === s.dealId);
      const title = s.dealId === deal.id ? deal.title : deal.otherDeals?.find((o) => o.id === s.dealId)?.title ?? s.dealId;
      return { s, title, ...verifySuggestion(s, open, text, cand) };
    })
    .sort((a, b) => b.s.confidence - a.s.confidence);
  const shown = results.filter((r) => r.show);
  const hidden = results.length - shown.length;
  return (
    <section className="rounded-card border border-line bg-white p-3" aria-label="Suggested deals" data-tour="suggestions">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-small text-ink">This email may belong to</span>
        <HonestyChip kind="ai" />
        <HonestyChip kind="live" title="Live check: a domain or quote number must really match" />
      </div>
      {shown.length === 0 && <p className="text-small text-ink-muted">No deal matches this email's supplier domain or quote number.</p>}
      <ul className="space-y-2">
        {shown.map(({ s, title, verified }, i) => (
          <li key={s.dealId} className="rounded-chip border border-line p-2">
            <div className="flex items-center gap-2">
              <span className="text-small text-teal">{s.dealId}</span>
              <span className="flex-1 truncate text-small text-ink">{title}</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {verified.map((r) => (
                <li key={r.type + r.detail} className="flex items-center gap-1.5 text-xs text-ink-muted">
                  {r.ok ? <Check size={12} strokeWidth={2} className="text-teal" aria-label="verified" /> : <X size={12} strokeWidth={2} aria-label="not verified" />}
                  {r.type === "supplier_domain" ? "Same supplier domain" : r.type === "quote_number" ? "Same quote number" : r.type === "people" ? "Same people" : "Similar product"}: {r.detail}
                </li>
              ))}
            </ul>
            <Button size="sm" variant={i === 0 ? "primary" : "secondary"} className="mt-2 w-full" data-tour={`accept-${s.dealId}`} onClick={() => actions.pickDeal(s.dealId, "suggestion")}>
              Add to {s.dealId}
            </Button>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => actions.pickDeal(deal.id, "owner")} icon={<Plus size={14} strokeWidth={1.5} aria-hidden />}>
        New deal instead
      </Button>
      {hidden > 0 && (
        <p className="mt-1 text-xs text-ink-muted">
          {hidden} weaker match{hidden > 1 ? "es" : ""} hidden: no domain or quote number in common. Nothing is attached until you click.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Cards

function CardShell({ icon: Icon, title, chips, children, tour }: { icon: React.ElementType; title: string; chips?: React.ReactNode; children: React.ReactNode; tour?: string }) {
  return (
    <section className="rounded-card border border-line bg-white p-3" aria-label={title} data-tour={tour}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} strokeWidth={1.5} className="text-teal" aria-hidden />
        <h3 className="flex-1 text-small text-ink">{title}</h3>
        {chips}
      </div>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-xs text-ink-muted">Add this email or its thread to see this.</p>;
}

function Agreed({ hasMaterial }: { hasMaterial: boolean }) {
  const view = useDealView();
  const accepted = view.terms.filter((t) => t.status === "accepted").length;
  return (
    <CardShell icon={ListChecks} title="What's agreed so far" chips={<HonestyChip kind="ai" />} tour="card-agreed">
      {!hasMaterial ? (
        <Empty />
      ) : (
        <>
          <p className="mb-1 text-xs text-ink-muted">
            {accepted} of {view.terms.length} terms accepted by both, checked live against the added emails.
          </p>
          <ul>
            {view.terms.map((t) => {
              const last = t.steps[t.steps.length - 1];
              return (
                <li key={t.key}>
                  <button
                    className="flex min-h-11 w-full items-center gap-2 rounded-chip px-1 text-left hover:bg-surface-alt"
                    data-tour={`agreed-${t.key}`}
                    onClick={() => {
                      actions.setView("review");
                      if (last) actions.selectSource(last.messageId, last.quote);
                    }}
                  >
                    <span className="flex-1 truncate text-small text-ink">{t.label}</span>
                    <span className="truncate text-xs text-ink-muted" style={{ maxWidth: 96 }}>{t.value ?? ""}</span>
                    <StatusBadge status={t.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </CardShell>
  );
}

function Missing({ hasMaterial }: { hasMaterial: boolean }) {
  const view = useDealView();
  const blockers = sidebarBlockers(view);
  return (
    <CardShell icon={ClipboardList} title="What's missing before I submit" chips={<HonestyChip kind="live" />} tour="card-missing">
      {!hasMaterial ? (
        <Empty />
      ) : (
        <>
          {blockers.length === 0 ? (
            <p className="flex items-center gap-1.5 text-small text-ink"><Check size={14} strokeWidth={2} className="text-teal" aria-hidden /> Nothing blocks submit.</p>
          ) : (
            <ul className="space-y-1">
              {blockers.map((b) => (
                <li key={b.label} className="flex items-start gap-2 text-small text-ink">
                  <AlertTriangle size={14} strokeWidth={1.5} className="mt-1 shrink-0 text-ink" aria-hidden />
                  <span className="flex-1">{b.label}</span>
                  <span className="text-xs text-ink-muted">You</span>
                </li>
              ))}
            </ul>
          )}
          {view.openForLegal.length > 0 && (
            <>
              <div className="mt-3 text-xs text-ink-muted">Goes to Legal as open</div>
              <ul>
                {view.openForLegal.map((t) => {
                  const chase = view.chase.find((c) => c.draft.termKey === t.key);
                  return (
                    <li key={t.key} className="flex min-h-11 items-center gap-2 border-t border-line first:border-t-0">
                      <span className="flex-1 truncate text-small text-ink">{t.label}</span>
                      <span className="text-xs text-ink-muted">{t.openOwner}</span>
                      {chase && (
                        <Button size="sm" variant="secondary" data-tour={`chase-${t.key}`} onClick={() => actions.openChase(t.key)} className="min-h-9 px-2 text-xs">
                          Draft supplier chase
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </CardShell>
  );
}

function Existing({ hasMaterial }: { hasMaterial: boolean }) {
  const view = useDealView();
  const r = view.repository;
  return (
    <CardShell icon={FolderSearch} title="Contracts we already have with this supplier" chips={<HonestyChip kind="mocked" title="Read-only lookup in a mock repository" />} tour="card-existing">
      {!hasMaterial ? (
        <Empty />
      ) : r.paused ? (
        <p className="text-small text-ink">Lookup paused: the threads name two legal entities. Resolve the entity first.</p>
      ) : r.matches.length ? (
        <>
          {r.matches.map((m) => (
            <div key={m.id} className="rounded-chip bg-surface-alt p-2 text-small">
              <div className="text-ink">{m.type}</div>
              <div className="text-xs text-ink-muted">
                {m.id} · {m.entity} · signed {fmtDate(m.signed)} {m.signed.slice(0, 4)}, expires {fmtDate(m.expires)} {m.expires.slice(0, 4)}
              </div>
            </div>
          ))}
          <p className="mt-2 text-xs text-ink">
            Likely: <span className="text-teal">{view.contractType.suggestion}</span>. <span className="text-ink-muted">Legal decides the paper.</span>
          </p>
        </>
      ) : (
        <>
          <p className="text-small text-ink">No match found in repository.</p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-muted">
            <Info size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden /> {r.coverage} This does not mean no agreement exists.
          </p>
          {r.restrictedHidden > 0 && <p className="mt-1 text-xs text-ink-muted">A restricted record may exist that you cannot see. Legal can check.</p>}
        </>
      )}
    </CardShell>
  );
}

function Reading({ step }: { step: number }) {
  return (
    <section className="rounded-card border border-line bg-white p-3" aria-live="polite" data-tour="reading">
      <ul className="space-y-1.5">
        {READ_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-small">
            {i + 1 < step ? (
              <Check size={15} strokeWidth={2} className="text-teal" aria-hidden />
            ) : i + 1 === step ? (
              <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-teal motion-reduce:animate-none" aria-hidden />
            ) : (
              <span className="inline-block h-[15px] w-[15px] rounded-full border border-line" aria-hidden />
            )}
            <span className={i + 1 <= step ? "text-ink" : "text-ink-muted"}>{s}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">Reading only what you added.</p>
      <div className="mt-3 space-y-2" aria-hidden>
        <div className="skeleton h-4 rounded-chip" />
        <div className="skeleton h-4 w-4/5 rounded-chip" />
      </div>
    </section>
  );
}

function MismatchWarning() {
  const dealId = useApp((s) => s.dealId);
  const w = useApp((s) => s.deals[s.dealId].pendingWarning)!;
  const deal = getDeal(dealId);
  return (
    <section role="alertdialog" aria-label="Different supplier" className="rounded-card border-2 border-quartz bg-white p-3" data-tour="mismatch">
      <div className="flex items-start gap-2">
        <ShieldAlert size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" aria-hidden />
        <div>
          <p className="text-small text-ink">This email is from {w.domains.join(", ")}, not {deal.supplier.domain}.</p>
          <p className="mt-1 text-xs text-ink-muted">{deal.id} is a deal with {deal.supplier.name}. Add it anyway only if it belongs here.</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-2">
        <Button size="sm" variant="primary" onClick={() => actions.cancelWarning()} data-tour="mismatch-cancel">
          Don't add
        </Button>
        <Button size="sm" variant="destructive" onClick={() => actions.confirmWarning()} data-tour="mismatch-add">
          Add anyway
        </Button>
      </div>
    </section>
  );
}

function AtInput({ open }: { open: boolean }) {
  const dealId = useApp((s) => s.dealId);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [q, setQ] = useState("");
  const options = deal.threads
    .map((t) => ({ t, emails: t.messageIds.filter((id) => deal.messages.find((m) => m.id === id)!.kind === "email") }))
    .filter(({ emails }) => emails.some((id) => !view.addedIds.has(id)))
    .filter(({ t }) => !q.replace("@", "") || `${t.label} ${t.subject}`.toLowerCase().includes(q.replace("@", "").toLowerCase()));
  return (
    <section className="relative" aria-label="Add another thread">
      <label className="flex min-h-11 items-center gap-2 rounded-card border border-line bg-white px-3">
        <AtSign size={15} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
        <input
          data-tour="at-input"
          value={q}
          onFocus={() => actions.setAtOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            actions.setAtOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") actions.setAtOpen(false);
          }}
          placeholder="Type @ to add another thread"
          className="w-full bg-transparent text-small outline-none"
          aria-label="Type @ to add another thread"
          aria-expanded={open}
          aria-controls="at-list"
        />
      </label>
      {open && (
        <ul id="at-list" role="listbox" className="mt-1 rounded-card border border-line bg-white p-1 fade-in" data-tour="at-list">
          {options.length === 0 && <li className="px-3 py-2 text-xs text-ink-muted">All threads on this deal are added.</li>}
          {options.map(({ t, emails }) => {
            const ext = deal.messages.find((m) => t.messageIds.includes(m.id) && !m.from.email.endsWith("halden.example"));
            const other = ext && domainOf(ext.from.email) !== deal.supplier.domain;
            return (
              <li key={t.id} role="option" aria-selected={false}>
                <button
                  className="flex min-h-11 w-full items-center gap-2 rounded-chip px-2 text-left hover:bg-surface-alt"
                  data-tour={`at-${t.id}`}
                  onClick={() => {
                    setQ("");
                    actions.addThread(t.id);
                  }}
                >
                  <Mail size={14} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
                  <span className="flex-1 truncate text-small text-ink">{t.label}</span>
                  <span className="text-xs text-ink-muted">{other ? "other domain" : `${emails.length} email${emails.length > 1 ? "s" : ""}`}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button className="min-h-9 w-full rounded-chip px-2 text-left text-xs text-ink-muted hover:bg-surface-alt" onClick={() => actions.setAtOpen(false)}>
              Close
            </button>
          </li>
        </ul>
      )}
    </section>
  );
}

function AddedItems() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const deal = getDeal(dealId);
  const live = ds.added.filter((a) => !a.removed);
  const submitted = !!ds.submit.requestId;
  if (live.length === 0) return null;
  return (
    <section className="rounded-card border border-line bg-white p-3" aria-label="Added to this deal" data-tour="added-items">
      <h3 className="mb-1 text-small text-ink">
        Added to {ds.pickedDealId} <span className="text-ink-muted">({live.length})</span>
      </h3>
      <ul>
        {live.map((a) => {
          const m = deal.messages.find((x) => x.id === a.messageId)!;
          return (
            <li key={a.messageId} className="flex min-h-11 items-center gap-2 border-t border-line first:border-t-0">
              {m.kind === "pdf" ? <FileText size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden /> : <Mail size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-ink">{m.kind === "pdf" ? m.filename : `${m.from.name}, ${fmtDate(m.date)}`}</span>
                <span className={cx("block truncate text-xs", a.addedBy !== "Sam Okafor" ? "text-teal" : "text-ink-muted")}>
                  Added by {a.addedBy} · {fmtDate(a.addedAt, true)}
                  {submitted && a.addedAt > (ds.audit.find((x) => x.action === "Submitted")?.at ?? "9") ? " · added after submit" : ""}
                </span>
              </span>
              {!submitted && (
                <button onClick={() => actions.removeItem(a.messageId)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-button text-ink-muted hover:bg-surface-alt" aria-label={`Remove ${m.kind === "pdf" ? m.filename : m.subject} from deal`} data-tour={`remove-${a.messageId}`}>
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-xs text-ink-muted">Removals before submit are logged.</p>
    </section>
  );
}
