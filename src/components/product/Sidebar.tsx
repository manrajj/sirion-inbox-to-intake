"use client";

import { useMemo, useState } from "react";
import { X, Plus, Check, Loader2, ShieldAlert, ListChecks, ArrowUpRight, ArrowLeft, AtSign, Mail, FileText, ChevronDown, ArrowUp, Pin, Quote } from "lucide-react";
import { actions, useApp, useDealView, threadOf, threadAttachments } from "@/lib/store";
import { getDeal } from "@data/index";
import { domainOf } from "@/lib/checks";
import type { TermView } from "@/lib/derive";
import { Button, cx, fmtDate } from "@/components/ui";
import { SirionMark } from "./SirionMark";

// The Sirion add-in, docked in Outlook's add-in pane and laid out like Harvey for
// Outlook: a title bar, the deal it is working on, three suggestions, an answer
// view, and a prompt box at the bottom.

const READ_STEPS = ["Reading the emails", "Reading the quote PDF", "Checking each term against its source"];

/** Open a cited sentence in the mail reading pane. */
export const citeInMail = (messageId: string, quote?: string) => actions.cite(messageId, quote);

export function Sidebar() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const openId = useApp((s) => s.openMessageId);
  const panel = useApp((s) => s.panel);
  const view = useDealView();
  const deal = getDeal(dealId);
  const byId = useMemo(() => new Map(deal.messages.map((m) => [m.id, m])), [deal]);
  const thread = threadOf(deal, openId);
  const threadIds = [...thread.messageIds.filter((id) => byId.get(id)!.kind === "email"), ...threadAttachments(deal, openId).map((m) => m.id)];
  const notAdded = threadIds.filter((id) => !view.addedIds.has(id));
  const emailsLeft = notAdded.filter((id) => byId.get(id)!.kind === "email").length;
  const pdfsLeft = notAdded.length - emailsLeft;
  const submitted = !!ds.submit.requestId;
  const reading = ds.reading > 0;

  const addSub =
    notAdded.length === 0
      ? "Added"
      : [emailsLeft ? `${emailsLeft} email${emailsLeft === 1 ? "" : "s"}` : "", pdfsLeft ? `${pdfsLeft} PDF${pdfsLeft === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[8px] border border-mail-line bg-white shadow-card md:w-[340px]" aria-label="Sirion add-in" data-tour="sidebar">
      {/* Outlook add-in title bar */}
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-mail-line bg-mail-pane pl-3 pr-1 text-mail-text">
        <SirionMark size={16} />
        <span className="text-small font-semibold">Sirion</span>
        <span className="ml-auto inline-flex h-10 w-9 items-center justify-center text-mail-muted" aria-hidden>
          <Pin size={14} strokeWidth={1.5} />
        </span>
        <button onClick={() => actions.toggleSidebar(false)} className="inline-flex h-10 w-9 items-center justify-center rounded-[4px] text-mail-muted hover:bg-mail-blue-soft" aria-label="Close Sirion">
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {ds.pendingWarning && <MismatchWarning />}
        {reading ? (
          <Reading step={ds.reading} />
        ) : panel === "home" ? (
          <section aria-label="Suggestions">
            <p className="text-h3 font-medium text-ink">Hi Manraj</p>
            <p className="mt-0.5 text-small text-ink-muted">This email is part of a deal you're on.</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-chip bg-teal px-3 py-1.5 text-small text-white" data-tour="deal-chip">
              {dealId} · {deal.supplier.name}
            </span>
            <h2 className="mt-5 pb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">Suggested</h2>
            <ul className="divide-y divide-line border-y border-line">
              <Suggestion
                tour="add-to-sirion"
                icon={notAdded.length ? Plus : Check}
                label={notAdded.length ? "Add this thread to the deal" : "This thread is in the deal"}
                sub={addSub}
                done={notAdded.length === 0}
                onClick={() => actions.addMessages(notAdded, "thread")}
                disabled={submitted}
              />
              <Suggestion tour="card-agreed" icon={ListChecks} label="What's agreed so far?" sub="Each term, with its source" onClick={() => actions.setPanel("agreed")} />
              <Suggestion
                tour="review-in-sirion"
                icon={ArrowUpRight}
                label={submitted ? `Open ${ds.submit.requestId} in Sirion` : "Create the intake request in Sirion"}
                sub={submitted ? "Created" : "Filled in from these emails"}
                onClick={() => actions.setView("sirion")}
              />
            </ul>
          </section>
        ) : (
          <Answer />
        )}
      </div>

      <Composer />
    </aside>
  );
}

function Suggestion({ icon: Icon, label, sub, onClick, tour, done, disabled }: { icon: React.ElementType; label: string; sub: string; onClick: () => void; tour: string; done?: boolean; disabled?: boolean }) {
  return (
    <li>
      <button onClick={onClick} disabled={done || disabled} data-tour={tour} className="group flex min-h-[52px] w-full items-center gap-3 py-2 text-left disabled:cursor-default">
        <span className={cx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-teal text-white" : "bg-surface-alt text-teal group-hover:bg-teal group-hover:text-white")}>
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-small text-ink">{label}</span>
          <span className="block truncate text-xs text-ink-muted">{sub}</span>
        </span>
      </button>
    </li>
  );
}

const settling = (t: TermView) => [...t.steps].reverse().find((s) => s.role !== "statement") ?? t.steps[0];

function Answer() {
  const view = useDealView();
  const agreed = view.terms.filter((t) => t.status === "accepted" || t.status === "offEmail");
  const conflicts = view.terms.filter((t) => t.needsDecision);
  const nothing = !view.terms.some((t) => t.steps.length);
  return (
    <section aria-label="What's agreed so far" className="fade-in">
      <button onClick={() => actions.setPanel("home")} className="-ml-1 mb-3 inline-flex min-h-9 items-center gap-1 rounded-button px-1 text-small text-teal hover:bg-surface-alt" data-tour="panel-back">
        <ArrowLeft size={15} strokeWidth={1.5} aria-hidden /> Back
      </button>
      <p className="ml-auto w-fit rounded-[12px] rounded-br-[4px] bg-teal px-3 py-2 text-small text-white">What's agreed so far?</p>
      <div className="mt-4">
        {nothing ? (
          <p className="text-small text-ink">Nothing yet. I only read emails you add to the deal. Add this thread first.</p>
        ) : (
          <>
            <p className="text-small text-ink">
              {agreed.length} terms are agreed by both sides in writing{conflicts.length ? `, and ${conflicts[0].label.toLowerCase()} still differ between the email and the quote` : ""}.
            </p>
            <ul className="mt-3 divide-y divide-line border-y border-line" data-tour="agreed-list">
              {agreed.map((t) => {
                const s = settling(t);
                return (
                  <li key={t.key} className="flex items-center gap-2 py-2" data-tour={`agreed-${t.key}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-ink-muted">{t.label}</span>
                      <span className="block text-small text-ink">{t.value}</span>
                    </span>
                    <button
                      onClick={() => citeInMail(s.messageId, s.quote)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-teal"
                      aria-label={`Show where ${t.label.toLowerCase()} was agreed: ${s.author}, ${fmtDate(s.date)}`}
                      title={`${s.author}, ${fmtDate(s.date)}`}
                      data-tour={`cite-${t.key}`}
                    >
                      <Quote size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Example AI output, checked against the emails in your browser.</p>
            <Button size="sm" variant="primary" className="mt-4 w-full" onClick={() => actions.setView("sirion")} icon={<ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />}>
              Create the intake request in Sirion
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function Reading({ step }: { step: number }) {
  return (
    <section className="rounded-[10px] border border-line p-3" aria-live="polite" data-tour="reading">
      <div className="mb-2 flex items-center gap-2 text-small text-ink">
        <SirionMark size={18} /> Reading what you added
      </div>
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
    </section>
  );
}

function MismatchWarning() {
  const dealId = useApp((s) => s.dealId);
  const w = useApp((s) => s.deals[s.dealId].pendingWarning)!;
  const deal = getDeal(dealId);
  return (
    <section role="alertdialog" aria-label="Different supplier" className="mb-3 rounded-[10px] border-2 border-quartz bg-white p-3" data-tour="mismatch">
      <div className="flex items-start gap-2">
        <ShieldAlert size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" aria-hidden />
        <div>
          <p className="text-small text-ink">This email is from {w.domains.join(", ")}, not {deal.supplier.domain}.</p>
          <p className="mt-1 text-xs text-ink-muted">
            {deal.id} is your deal with {deal.supplier.name}. Add it only if it belongs here.
          </p>
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

/** The prompt box: @ adds a thread; a question is answered by the matching suggestion. */
function Composer() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const atOpen = useApp((s) => s.atOpen);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [q, setQ] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const live = ds.added.filter((a) => !a.removed);
  const submitted = !!ds.submit.requestId;
  const options = deal.threads
    .map((t) => ({ t, emails: t.messageIds.filter((id) => deal.messages.find((m) => m.id === id)!.kind === "email") }))
    .filter(({ emails }) => emails.some((id) => !view.addedIds.has(id)))
    .filter(({ t }) => !q.replace("@", "") || `${t.label} ${t.subject}`.toLowerCase().includes(q.replace("@", "").toLowerCase()));

  const ask = () => {
    const text = q.trim().toLowerCase();
    if (!text || text.startsWith("@")) return;
    setQ("");
    if (/open|missing|left|conflict|legal/.test(text)) actions.setPanel("open");
    else if (/agree|term|price|uplift|so far/.test(text)) actions.setPanel("agreed");
    else setNote("In this prototype I answer two questions: what's agreed, and what's still open.");
  };

  return (
    <div className="shrink-0 border-t border-line p-3">
      {atOpen && (
        <ul id="at-list" role="listbox" className="mb-2 rounded-[10px] border border-line bg-white p-1 shadow-pop fade-in" data-tour="at-list">
          <li className="px-2 py-1 text-xs text-ink-muted">Add a thread to {dealId}</li>
          {options.length === 0 && <li className="px-2 py-2 text-xs text-ink-muted">All threads are added.</li>}
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
                  <span className="text-xs text-ink-muted">{other ? "other supplier" : `${emails.length} email${emails.length > 1 ? "s" : ""}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {showSources && (
        <ul className="thin-scroll mb-2 max-h-[200px] overflow-y-auto rounded-[10px] border border-line p-1" aria-label={`Added to ${dealId}`} data-tour="added-list">
          {live.map((a) => {
            const m = deal.messages.find((x) => x.id === a.messageId)!;
            return (
              <li key={a.messageId} className="flex min-h-11 items-center gap-2 px-1">
                {m.kind === "pdf" ? <FileText size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden /> : <Mail size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
                <span className="min-w-0 flex-1 truncate text-xs text-ink">{m.kind === "pdf" ? m.filename : `${m.from.name}, ${fmtDate(m.date)}`}</span>
                {!submitted && (
                  <button onClick={() => actions.removeItem(a.messageId)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-button text-ink-muted hover:bg-surface-alt" aria-label={`Remove ${m.kind === "pdf" ? m.filename : m.subject} from deal`} data-tour={`remove-${a.messageId}`}>
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {note && (
        <p className="mb-2 rounded-chip bg-surface-alt px-2 py-1.5 text-xs text-ink" role="status">
          {note}
        </p>
      )}
      <div className="rounded-[12px] border border-line-strong bg-white px-3 pb-2 pt-2 focus-within:border-teal">
        <input
          data-tour="at-input"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setNote(null);
            actions.setAtOpen(v.includes("@"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") actions.setAtOpen(false);
            if (e.key === "Enter") ask();
          }}
          placeholder="Ask about this deal, or type @ to add sources"
          className="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
          aria-label="Ask about this deal. Type @ to add sources."
          aria-expanded={atOpen}
          aria-controls="at-list"
        />
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={() => actions.setAtOpen(!atOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
            aria-label="Add a thread"
            data-tour="at-button"
          >
            <AtSign size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setShowSources((v) => !v)}
            className="inline-flex h-8 items-center gap-1 rounded-pill border border-line px-2.5 text-xs text-ink hover:bg-surface-alt"
            aria-expanded={showSources}
            data-tour="added-items"
          >
            {live.length} source{live.length === 1 ? "" : "s"} added
            <ChevronDown size={13} strokeWidth={1.5} aria-hidden className={cx("transition-transform", showSources && "rotate-180")} />
          </button>
          <button onClick={ask} className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white hover:opacity-90 disabled:opacity-40" disabled={!q.trim() || q.trim().startsWith("@")} aria-label="Ask">
            <ArrowUp size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
