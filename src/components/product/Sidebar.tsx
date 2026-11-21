"use client";

import { useMemo, useState } from "react";
import {
  X,
  Plus,
  Check,
  Loader2,
  ShieldAlert,
  ListChecks,
  CircleHelp,
  ArrowUpRight,
  ArrowLeft,
  AtSign,
  Mail,
  FileText,
  ChevronDown,
  ArrowUp,
  Pin,
} from "lucide-react";
import { actions, useApp, useDealView, threadOf, threadAttachments } from "@/lib/store";
import { getDeal } from "@data/index";
import { domainOf } from "@/lib/checks";
import { reasonFor, type TermView } from "@/lib/derive";
import { Button, HonestyChip, StatusBadge, cx, fmtDate } from "@/components/ui";
import { SirionMark } from "./SirionMark";

// The Sirion add-in, kept as plain as an assistant pane: a deal chip, a short
// list of suggestions, an answer view, and a prompt box at the bottom.

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

  const addLabel = notAdded.length === 0 ? `This thread is in ${dealId}` : `Add this thread to ${dealId}`;
  const addSub =
    notAdded.length === 0
      ? `${threadIds.length} item${threadIds.length === 1 ? "" : "s"} added`
      : [emailsLeft ? `${emailsLeft} email${emailsLeft === 1 ? "" : "s"}` : "", pdfsLeft ? `${pdfsLeft} PDF${pdfsLeft === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ") + ` · ${thread.subject}`;

  return (
    <aside
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-[8px] bg-white shadow-card md:w-[360px]"
      aria-label="Sirion add-in"
      data-tour="sidebar"
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="flex items-center gap-2 text-small font-medium text-ink">
          <SirionMark size={18} /> Sirion for Outlook
        </span>
        <span className="flex items-center">
          <HonestyChip kind="mocked" title="Mock of the Outlook add-in" />
          <span className="inline-flex h-11 w-9 items-center justify-center text-ink-muted" aria-hidden>
            <Pin size={15} strokeWidth={1.5} />
          </span>
          <button onClick={() => actions.toggleSidebar(false)} className="inline-flex h-11 w-9 items-center justify-center rounded-button text-ink-muted hover:bg-surface-alt" aria-label="Close Sirion">
            <X size={16} strokeWidth={1.5} />
          </button>
        </span>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-pill bg-tone-success-bg px-2.5 py-1 text-xs text-tone-success-fg" data-tour="deal-chip">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden />
          <span className="truncate">
            {dealId} · {deal.supplier.name}
          </span>
        </span>
        <span className="ml-auto shrink-0 text-xs text-ink-muted">{submitted ? `Submitted as ${ds.submit.requestId}` : "Draft request"}</span>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
        {ds.pendingWarning && <MismatchWarning />}
        {reading ? (
          <Reading step={ds.reading} />
        ) : panel === "home" ? (
          <section aria-label="Suggestions">
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <SirionMark size={28} />
              <p className="text-small text-ink">
                Hi Manraj. This email is part of your Brightline deal.
              </p>
            </div>
            <h2 className="px-1 pb-1 text-xs text-ink-muted">Suggestions for this email</h2>
            <ul className="space-y-1.5">
              <Suggestion
                tour="add-to-sirion"
                icon={notAdded.length ? Plus : Check}
                label={addLabel}
                sub={addSub}
                done={notAdded.length === 0}
                onClick={() => actions.addMessages(notAdded, "thread")}
                disabled={submitted}
              />
              <Suggestion tour="card-agreed" icon={ListChecks} label="What's agreed so far?" sub="Each term with the email it came from" onClick={() => actions.setPanel("agreed")} />
              <Suggestion tour="card-missing" icon={CircleHelp} label="What's still open?" sub="Conflicts and items for Legal" onClick={() => actions.setPanel("open")} />
              <Suggestion
                tour="review-in-sirion"
                icon={ArrowUpRight}
                label={submitted ? `View request ${ds.submit.requestId} in Sirion` : "Open the request in Sirion"}
                sub={submitted ? "Sent to Legal" : "Prefilled from the emails you added"}
                onClick={() => actions.setView("sirion")}
              />
            </ul>
          </section>
        ) : (
          <Answer panel={panel} />
        )}
      </div>

      <Composer />
    </aside>
  );
}

function Suggestion({
  icon: Icon,
  label,
  sub,
  onClick,
  tour,
  done,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  onClick: () => void;
  tour: string;
  done?: boolean;
  disabled?: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={done || disabled}
        data-tour={tour}
        className={cx(
          "flex min-h-[48px] w-full items-center gap-3 rounded-[10px] border px-3 py-1.5 text-left transition-colors",
          done ? "border-transparent bg-surface-alt" : "border-line bg-white hover:border-teal hover:bg-tone-success-bg",
          "disabled:cursor-default",
        )}
      >
        <span className={cx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-teal text-white" : "bg-surface-alt text-teal")}>
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

function CiteChips({ t }: { t: TermView }) {
  return (
    <span className="flex flex-wrap gap-1">
      {t.steps.map((s, i) => (
        <button
          key={i}
          onClick={() => citeInMail(s.messageId, s.quote)}
          title={`${s.author}, ${fmtDate(s.date)}: "${s.quote}"`}
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-pill border border-line px-1.5 text-xs text-ink-muted hover:border-teal hover:text-teal"
          aria-label={`Show source ${i + 1} for ${t.label}: ${s.author}, ${fmtDate(s.date)}`}
          data-tour={`cite-${t.key}-${i}`}
        >
          {i + 1}
        </button>
      ))}
    </span>
  );
}

function Answer({ panel }: { panel: "agreed" | "open" }) {
  const view = useDealView();
  const agreed = view.terms.filter((t) => t.status === "accepted" || t.status === "offEmail");
  const conflicts = view.terms.filter((t) => t.needsDecision);
  const open = view.terms.filter((t) => t.goesToLegalOpen);
  const nothing = view.coverage.messagesRead === 0 || !view.terms.some((t) => t.steps.length);
  return (
    <section aria-label={panel === "agreed" ? "What's agreed so far" : "What's still open"} className="fade-in">
      <button onClick={() => actions.setPanel("home")} className="mb-2 inline-flex min-h-9 items-center gap-1 rounded-button px-1 text-small text-teal hover:bg-surface-alt" data-tour="panel-back">
        <ArrowLeft size={15} strokeWidth={1.5} aria-hidden /> Suggestions
      </button>
      <p className="ml-auto w-fit max-w-[85%] rounded-[12px] rounded-br-[4px] bg-surface-alt px-3 py-2 text-small text-ink">{panel === "agreed" ? "What's agreed so far?" : "What's still open?"}</p>
      <div className="mt-3 flex items-start gap-2">
        <SirionMark size={22} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {nothing ? (
            <p className="text-small text-ink">Nothing yet. I only read emails you add to the deal. Add the Brightline thread first.</p>
          ) : panel === "agreed" ? (
            <>
              <p className="text-small text-ink">
                {agreed.length} term{agreed.length === 1 ? " is" : "s are"} agreed by both sides in writing. Click a number to see the sentence.
              </p>
              <ul className="mt-2 divide-y divide-line rounded-[10px] border border-line" data-tour="agreed-list">
                {agreed.map((t) => (
                  <li key={t.key} className="px-3 py-2" data-tour={`agreed-${t.key}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted">{t.label}</span>
                      <CiteChips t={t} />
                    </div>
                    <div className="text-small text-ink">{t.value}</div>
                  </li>
                ))}
              </ul>
              {conflicts.length > 0 && (
                <p className="mt-2 text-small text-ink">
                  {conflicts.length === 1 ? `${conflicts[0].label} is not agreed: the emails and the quote disagree.` : `${conflicts.length} terms have conflicting values.`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-small text-ink">
                {conflicts.length ? `${conflicts.length} conflict to settle, and ` : ""}
                {open.length} item{open.length === 1 ? "" : "s"} will go to Legal as open.
              </p>
              <ul className="mt-2 divide-y divide-line rounded-[10px] border border-line" data-tour="open-list">
                {conflicts.map((t) => (
                  <li key={t.key} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted">{t.label}</span>
                      <StatusBadge status="conflict" />
                    </div>
                    <div className="mt-1 space-y-1">
                      {t.conflict!.options.map((o, i) => (
                        <button key={i} onClick={() => citeInMail(o.messageId, o.quote)} className="flex w-full items-center justify-between gap-2 rounded-chip px-1 text-left text-small text-ink hover:bg-surface-alt">
                          <span>{o.value}</span>
                          <span className="text-xs text-ink-muted">
                            {o.messageId.startsWith("pdf") ? "Quote PDF" : `${o.author}'s email`}, {fmtDate(o.date)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
                {open.map((t) => (
                  <li key={t.key} className="px-3 py-2">
                    <div className="text-xs text-ink-muted">{t.label}</div>
                    <div className="text-small text-ink">{t.resolution?.type === "open" ? t.resolution.reason : reasonFor(t)}</div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">You settle conflicts on the request. Open items go to Legal with a reason, never as agreed.</p>
            </>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            <HonestyChip kind="ai" />
            <HonestyChip kind="live" title="Every citation was matched word for word in your browser" />
          </div>
          {!nothing && (
            <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => actions.setView("sirion")} icon={<ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />}>
              Open the request in Sirion
            </Button>
          )}
        </div>
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
