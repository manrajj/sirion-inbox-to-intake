"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Check,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Mail,
  FileText,
  Pin,
  Quote,
  CornerDownRight,
  Paperclip,
  Copy,
  Link2,
  Unlink,
} from "lucide-react";
import { actions, useApp, useDealView, threadOf, threadAttachments, relatedThreads } from "@/lib/store";
import { getDeal } from "@data/index";
import { domainOf } from "@/lib/checks";
import type { TermView } from "@/lib/derive";
import { Button, cx, fmtDate } from "@/components/ui";
import { SirionMark } from "./SirionMark";

// The Sirion add-in, laid out like Harvey for Outlook: a tab header with pin and
// close, a toolbar with the deal chip, a centred mark over "Suggestions for your
// email", a bordered suggestion list, and a prompt card at the bottom.

const READ_STEPS = ["Reading the emails", "Reading the quote PDF", "Checking each term against its source"];

/**
 * Says, in plain words, how the open email relates to the deal. The rules are the
 * deal-match checks: the sender's domain is the deal's supplier, the thread names the
 * deal's quote, or it is an internal thread about the same supplier.
 */
function MatchReason() {
  const dealId = useApp((s) => s.dealId);
  const openId = useApp((s) => s.openMessageId);
  const picked = useApp((s) => !!s.deals[s.dealId].pickedDealId);
  const view = useDealView();
  const deal = getDeal(dealId);
  const thread = threadOf(deal, openId);
  const msgs = thread.messageIds.map((id) => deal.messages.find((m) => m.id === id)!);
  const emails = msgs.filter((m) => m.kind === "email");
  const domains = new Set(emails.map((m) => domainOf(m.from.email)));
  const quote = msgs.map((m) => m.body).join(" ").match(/Q-[A-Z]{2}-\d{3,}/)?.[0];
  const fromSupplier = domains.has(deal.supplier.domain);
  const fromRival = deal.rival && domains.has(deal.rival.domain);
  const added = emails.every((m) => view.addedIds.has(m.id));
  const first = deal.supplier.name.split(" ")[0];
  const b = (x: string) => <b className="font-medium">{x}</b>;

  let ok = true;
  let text: React.ReactNode;
  if (!picked) {
    text = fromRival ? (
      <>No Sirion deal for this email. It is from {b(deal.rival!.domain)}.</>
    ) : (
      <>
        No Sirion deal for this email yet. It is from {b(fromSupplier ? deal.supplier.domain : "your team")}
        {quote ? <>, about quote {b(quote)}</> : null}.
      </>
    );
  } else if (fromRival && !fromSupplier) {
    ok = false;
    text = <>Not part of this request: sent from {b(deal.rival!.domain)}, and the supplier here is {deal.supplier.name}.</>;
  } else if (fromSupplier) {
    text = (
      <>
        In this request: it comes from {b(deal.supplier.domain)}, the supplier{quote ? <>, and names quote {b(quote)}</> : null}.
      </>
    );
  } else if (added) {
    text = <>In this request: an internal thread that mentions {first}, added when you started it.</>;
  } else {
    text = <>Mentions {first}, the supplier on this request.</>;
  }
  return (
    <p
      className={cx(
        "mx-3 mb-1 flex items-start gap-1.5 rounded-[6px] px-2.5 py-1.5 text-xs leading-[18px]",
        ok ? "bg-white text-ink-muted" : "bg-tone-warn-bg text-tone-warn-fg",
      )}
      data-tour="match-reason"
    >
      {ok ? <Link2 size={13} strokeWidth={1.75} className="mt-[2px] shrink-0 text-teal" aria-hidden /> : <Unlink size={13} strokeWidth={1.75} className="mt-[2px] shrink-0" aria-hidden />}
      <span>{text}</span>
    </p>
  );
}

/** Open a cited sentence in the mail reading pane. */
export const citeInMail = (messageId: string, quote?: string) => actions.cite(messageId, quote);

export function Sidebar({ mobile }: { mobile?: boolean } = {}) {
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
  const picked = !!ds.pickedDealId;
  const related = relatedThreads(deal);
  const counts = [emailsLeft ? `${emailsLeft} email${emailsLeft === 1 ? "" : "s"}` : "", pdfsLeft ? `${pdfsLeft} PDF` : ""].filter(Boolean).join(", ");

  return (
    <aside
      className={cx("flex shrink-0 flex-col overflow-hidden bg-addin-bg", mobile ? "h-full w-full" : "w-[340px] rounded-[8px] border border-addin-line shadow-card")}
      aria-label="Sirion add-in"
      data-tour="sidebar"
    >
      {mobile ? (
        // Outlook mobile opens an add-in full screen, with a plain title bar and a close button.
        <header className="flex h-12 shrink-0 items-center border-b border-addin-line bg-white px-1 text-mail-text">
          <button onClick={() => actions.toggleSidebar(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-mail-text" aria-label="Close Sirion">
            <X size={20} strokeWidth={1.75} />
          </button>
          <span className="flex flex-1 items-center justify-center gap-1.5 text-[15px] font-semibold">
            <SirionMark size={15} /> Sirion
          </span>
          <span className="w-11" aria-hidden />
        </header>
      ) : (
      <header className="flex h-10 shrink-0 items-end border-b border-addin-line bg-white pl-2 text-mail-text">
        <span className="flex h-10 items-center gap-1.5 border-b-2 border-teal px-2 text-small font-semibold">
          <SirionMark size={13} />
          Sirion for Outlook
          <Pin size={14} strokeWidth={2} className="fill-current text-teal" aria-hidden />
          <button onClick={() => actions.toggleSidebar(false)} className="inline-flex h-8 w-7 items-center justify-center rounded-[4px] text-mail-muted hover:bg-mail-blue-soft" aria-label="Close Sirion">
            <X size={15} strokeWidth={1.75} />
          </button>
        </span>
        <span className="flex h-10 items-center px-3 text-small text-mail-muted" aria-hidden>
          My Day
        </span>
      </header>
      )}

      {/* The draft request this email belongs to: one name, nothing else */}
      <div className="flex h-10 shrink-0 items-center justify-center px-2">
        <span className={cx("inline-flex items-center gap-1.5 text-small", picked ? "text-ink" : "text-ink-muted")} data-tour="deal-chip">
          {picked ? (
            <>
              <span className="rounded-chip bg-white px-1.5 text-xs font-medium text-teal">Draft</span>
              {deal.supplier.name} request · {dealId}
            </>
          ) : (
            "No request yet"
          )}
        </span>
      </div>

      {picked && <MatchReason />}

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {ds.pendingWarning && <MismatchWarning />}
        {reading ? (
          <div className="pt-2">
            <Reading step={ds.reading} />
          </div>
        ) : panel === "home" ? (
          <section aria-label="Suggestions" className="fade-in">
            <div className="flex flex-col items-center pb-4 pt-5">
              <span className="inline-flex h-12 w-14 items-center justify-center rounded-[10px] bg-white shadow-card">
                <SirionMark size={24} />
              </span>
              <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">Intake</span>
              <p className="mt-3 text-small text-ink-muted">Suggestions for your email</p>
            </div>
            {!picked ? (
              <>
                <ul className="overflow-hidden rounded-[8px] border border-addin-line bg-white">
                  <Suggestion
                    tour="create-deal"
                    label={`Start an intake request for ${deal.supplier.name.split(" ")[0]}`}
                    meta={`${related.length} threads`}
                    onClick={() => actions.createDeal()}
                  />
                </ul>
              </>
            ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[8px] border border-addin-line bg-white">
              <Suggestion
                tour="add-to-sirion"
                done={notAdded.length === 0}
                disabled={submitted}
                label={notAdded.length ? "Add this thread to the request" : "Thread added to the request"}
                meta={notAdded.length ? counts : undefined}
                onClick={() => actions.addMessages(notAdded, "thread")}
              />
              <Suggestion tour="card-agreed" label="What's agreed so far?" onClick={() => actions.setPanel("agreed")} />
              <Suggestion
                tour="review-in-sirion"
                label={submitted ? `Open ${ds.submit.requestId} in Sirion` : "Review and submit in Sirion"}
                onClick={() => actions.setView("sirion")}
              />
            </ul>
            )}
            {picked && <AddedFiles />}
          </section>
        ) : (
          <Answer />
        )}
      </div>

      <Composer />
    </aside>
  );
}

function Suggestion({ label, meta, onClick, tour, done, disabled }: { label: string; meta?: string; onClick: () => void; tour: string; done?: boolean; disabled?: boolean }) {
  return (
    <li>
      <button onClick={onClick} disabled={done || disabled} data-tour={tour} className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-small text-ink hover:bg-surface-alt disabled:cursor-default disabled:hover:bg-transparent">
        {done ? <Check size={14} strokeWidth={2} className="shrink-0 text-teal" aria-hidden /> : <CornerDownRight size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
        <span className={cx("flex-1", done && "text-ink-muted")}>{label}</span>
        {meta && <span className="text-xs text-ink-muted">{meta}</span>}
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
  // A short "assessing" beat before the answer, as an assistant shows while it works.
  const [thinking, setThinking] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setThinking(false), 1100);
    return () => clearTimeout(id);
  }, []);
  return (
    <section aria-label="Assistant" className="fade-in">
      <div className="-mx-3 mb-3 flex h-10 items-center gap-2 border-b border-addin-line px-3">
        <button onClick={() => actions.setPanel("home")} className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-ink hover:bg-surface-alt" aria-label="Back to suggestions" data-tour="panel-back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-small font-medium text-ink">Assistant</span>
      </div>
      <p className="rounded-[12px] bg-white px-3.5 py-3 text-small leading-5 text-ink shadow-card" data-tour="assistant-prompt">
        What&apos;s agreed so far on this deal? List each term with the sentence it came from.
      </p>
      <div className="mt-1.5 flex justify-end text-ink-muted" aria-hidden>
        <Copy size={13} strokeWidth={1.5} />
      </div>
      <div className="mt-3">
        {thinking ? (
          <p className="assess-shimmer text-small text-ink-muted" role="status" data-tour="assessing">
            Assessing query
          </p>
        ) : nothing ? (
          <p className="text-small text-ink">Nothing yet. I only read emails you add to the request. Add this thread first.</p>
        ) : (
          <>
            <p className="text-small leading-6 text-ink">
              {agreed.length} terms are agreed by both sides in writing{conflicts.length ? `. ${conflicts[0].label} still differ between Tom's email and the quote` : ""}.
            </p>
            <ul className="mt-2" data-tour="agreed-list">
              {agreed.map((t) => {
                const s = settling(t);
                return (
                  <li key={t.key} className="flex items-start gap-2 py-1 text-small leading-6 text-ink" data-tour={`agreed-${t.key}`}>
                    <span aria-hidden>•</span>
                    <span className="flex-1">
                      {t.label}: <strong className="font-medium">{t.value}</strong>
                    </span>
                    <button
                      onClick={() => citeInMail(s.messageId, s.quote)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-teal"
                      aria-label={`Show where ${t.label.toLowerCase()} was agreed: ${s.author}, ${fmtDate(s.date)}`}
                      title={`${s.author}, ${fmtDate(s.date)}`}
                      data-tour={`cite-${t.key}`}
                    >
                      <Quote size={13} strokeWidth={1.75} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Example AI output, checked against the emails in your browser.</p>
            <Button size="sm" variant="primary" className="mt-3 w-full" onClick={() => actions.setView("sirion")} icon={<ArrowRight size={15} strokeWidth={1.5} aria-hidden />} data-tour="answer-review">
              Review and submit in Sirion
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

/** The prompt card: a files chip, a text box ("Type @ to add sources"), and a tool row. */
/** What the request holds, as one quiet line that opens the list (each item can be removed). */
function AddedFiles() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const deal = getDeal(dealId);
  const [showSources, setShowSources] = useState(false);
  const live = ds.added.filter((a) => !a.removed);
  const submitted = !!ds.submit.requestId;
  return (
    <div className="mt-3">
        <button
          onClick={() => setShowSources((v) => !v)}
          className="flex min-h-9 w-full items-center gap-2 rounded-[6px] px-1 hover:text-ink text-left text-xs text-ink-muted"
          aria-expanded={showSources}
          data-tour="added-items"
        >
          <Paperclip size={13} strokeWidth={1.5} aria-hidden /> {ds.pickedDealId ? `${live.length} emails and files in this request` : "No files yet"}
        </button>
        {showSources && (
          <ul className="thin-scroll mt-1 max-h-[180px] overflow-y-auto rounded-[6px] bg-white p-1" aria-label="Added to the request" data-tour="added-list">
            {live.map((a) => {
              const m = deal.messages.find((x) => x.id === a.messageId)!;
              return (
                <li key={a.messageId} className="flex min-h-10 items-center gap-2 px-1">
                  {m.kind === "pdf" ? <FileText size={13} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden /> : <Mail size={13} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{m.kind === "pdf" ? m.filename : `${m.from.name}, ${fmtDate(m.date)}`}</span>
                  {!submitted && (
                    <button onClick={() => actions.removeItem(a.messageId)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-ink-muted hover:bg-surface-alt" aria-label={`Remove ${m.kind === "pdf" ? m.filename : m.subject} from the request`} data-tour={`remove-${a.messageId}`}>
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}

function Composer() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const atOpen = useApp((s) => s.atOpen);
  const panel = useApp((s) => s.panel);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [q, setQ] = useState("");
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
    if (/agree|term|price|uplift|so far/.test(text)) actions.setPanel("agreed");
    else if (/sirion|request|intake|create/.test(text)) actions.setView("sirion");
    else setNote("In this prototype, try a suggestion above.");
  };

  return (
    <div className="shrink-0 px-3 pb-3">
      {atOpen && (
        <ul id="at-list" role="listbox" className="mb-2 rounded-[8px] border border-line bg-white p-1 shadow-pop fade-in" data-tour="at-list">
          <li className="px-2 py-1 text-xs text-ink-muted">Add a thread to the request</li>
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
      {note && (
        <p className="mb-2 rounded-chip bg-surface-alt px-2 py-1.5 text-xs text-ink" role="status">
          {note}
        </p>
      )}
      <div className="flex items-end gap-1 rounded-[10px] border border-addin-line bg-white p-2 focus-within:ring-1 focus-within:ring-teal">
        <textarea
          data-tour="at-input"
          rows={2}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setNote(null);
            actions.setAtOpen(v.includes("@"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") actions.setAtOpen(false);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder={panel === "home" ? "Ask Sirion about this request" : "Ask a follow-up"}
          className="min-w-0 flex-1 resize-none bg-transparent px-1 text-small leading-5 text-ink outline-none placeholder:text-ink-muted"
          aria-label="Ask Sirion about this request. Type @ to add a thread."
          aria-expanded={atOpen}
          aria-controls="at-list"
        />
        <div className="flex items-center justify-end">
          <button onClick={ask} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-ink text-white disabled:opacity-40" disabled={!q.trim() || q.trim().startsWith("@")} aria-label="Ask">
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
