"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Quote,
  Flag,
  Pencil,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Info,
  RotateCcw,
} from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { getDeal } from "@data/index";
import type { CoreFieldView, TermView } from "@/lib/derive";
import { CORE_FIELDS } from "@/lib/derive";
import { Button, HonestyChip, StatusBadge, Tick, cx, fmtDate, Modal, STEP_STATUS } from "@/components/ui";
import { SourceMessage } from "./SourceText";

const ROLE_LABEL: Record<string, string> = {
  offer: "Proposed",
  counter: "Countered",
  condition: "Conditional",
  resolution: "Condition resolved",
  acceptance: "Accepted",
  withdrawal: "Withdrawn",
  statement: "Stated in document",
};

export function Review() {
  const dealId = useApp((s) => s.dealId);
  const source = useApp((s) => s.source);
  const view = useDealView();
  const deal = getDeal(dealId);
  const [logOpen, setLogOpen] = useState(false);
  const srcMsg = source ? deal.messages.find((m) => m.id === source.messageId) : undefined;
  const coreBy = (g: "supplier" | "internal") => view.core.filter((c) => CORE_FIELDS.find((f) => f.key === c.key)!.group === g);

  return (
    <div className="flex h-full min-h-0 flex-col" data-tour="review">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <Button size="sm" variant="ghost" onClick={() => actions.setView("inbox")} icon={<ArrowLeft size={15} strokeWidth={1.5} aria-hidden />}>
          Inbox
        </Button>
        <h2 className="text-h2 text-ink">
          Deal review <span className="text-teal">{dealId}</span>
        </h2>
        <span className="truncate text-small text-ink-muted">{deal.title}</span>
        <span className="ml-auto flex gap-1">
          <HonestyChip kind="ai" />
          <HonestyChip kind="live" />
          <HonestyChip kind="mocked" title="The Sirion review screen is a mock" />
        </span>
      </div>
      <CoveragePanel />
      <div className="flex min-h-0 flex-1">
        <div className="thin-scroll min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {view.suspicious.length > 0 && (
            <div className="mb-3 rounded-card border-2 border-quartz bg-white p-3 text-small text-ink">
              Supplier text tried to instruct the AI (“{view.suspicious[0].quote.slice(0, 70)}…”). Ignored. The route comes from Legal's rules only.
            </div>
          )}
          <Group title="Supplier and scope">
            {coreBy("supplier").map((c) => (
              <CoreRow key={c.key} field={c} />
            ))}
          </Group>
          <Group title="Commercial terms">
            {view.terms.filter((t) => t.group === "commercial").map((t) => (
              <TermRow key={t.key} term={t} />
            ))}
          </Group>
          <Group title="Renewal and obligations">
            {view.terms.filter((t) => t.group === "renewal").map((t) => (
              <TermRow key={t.key} term={t} />
            ))}
            <Button size="sm" variant="ghost" className="mt-1" onClick={() => setLogOpen(true)} icon={<Pencil size={14} strokeWidth={1.5} aria-hidden />}>
              Log a term agreed on a call
            </Button>
          </Group>
          <Group title="Internal">
            {coreBy("internal").map((c) => (
              <CoreRow key={c.key} field={c} />
            ))}
          </Group>
          <SubmitBar />
        </div>
        <aside className="thin-scroll hidden w-[42%] max-w-[520px] shrink-0 overflow-y-auto border-l border-line bg-surface-alt p-4 md:block" aria-label="Source viewer" data-tour="source-viewer">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-small text-ink-muted">Source</span>
            {source?.quote && <span className="text-xs text-ink-muted">Cited sentence highlighted</span>}
          </div>
          <div className="rounded-card border border-line bg-white p-4">
            {srcMsg ? (
              <SourceMessage message={srcMsg} quote={source?.quote} />
            ) : (
              <p className="text-small text-ink-muted">Click any citation to see the sentence it came from.</p>
            )}
          </div>
        </aside>
      </div>
      <LogTermModal open={logOpen} onOpenChange={setLogOpen} />
      <SubmitModal />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4" aria-label={title}>
      <h3 className="mb-1 border-b border-line pb-1 text-h3 text-teal">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function CiteButtons({ evidence }: { evidence: { messageId: string; quote: string }[] }) {
  const source = useApp((s) => s.source);
  return (
    <span className="inline-flex gap-1">
      {evidence.map((e, i) => {
        const active = source?.messageId === e.messageId && source?.quote === e.quote;
        return (
          <button
            key={i}
            onClick={() => actions.selectSource(e.messageId, e.quote)}
            className={cx("inline-flex h-7 min-w-7 items-center justify-center rounded-chip border px-1.5 text-xs", active ? "border-teal bg-white text-teal" : "border-line text-ink-muted hover:text-teal")}
            aria-label={`Show source ${i + 1}`}
            data-tour={`cite-${e.messageId}`}
            style={{ minWidth: 28 }}
          >
            <Quote size={11} strokeWidth={1.75} aria-hidden />
            {i + 1}
          </button>
        );
      })}
    </span>
  );
}

function CoreRow({ field }: { field: CoreFieldView }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const submitted = useApp((s) => !!s.deals[s.dealId].submit.requestId);
  const missing = field.value === null;
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-1.5" data-tour={`core-${field.key}`}>
      <div className="w-full shrink-0 text-small text-ink-muted sm:w-40">{field.label}</div>
      <div className="min-w-[160px] flex-1">
        {field.conflictOptions ? (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-ink">
              <StatusBadge status="conflict" /> The threads name different entities. Pick the one on the deal.
            </p>
            <div className="flex flex-wrap gap-2">
              {field.conflictOptions.map((o) => (
                <Button key={o} size="sm" variant="secondary" onClick={() => actions.pickCore(field.key, o)}>
                  {o}
                </Button>
              ))}
            </div>
          </div>
        ) : missing || editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                actions.typeCore(field.key, draft.trim());
                setEditing(false);
                setDraft("");
              }
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={missing ? "Not found in added material. Type it" : field.value ?? ""}
              className="min-h-11 w-full rounded-chip border border-line px-3 text-small outline-none focus:border-teal"
              aria-label={`${field.label}, typed by hand`}
            />
            <Button size="sm" variant="secondary" type="submit">
              Save
            </Button>
            {editing && (
              <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-ink">{field.value}</span>
            {field.source === "typed" && <StatusBadge status="offEmail" label="Typed by hand" />}
            {field.source === "draft" && <span className="text-xs text-ink-muted">From the draft request</span>}
            {field.source === "picked" && <span className="text-xs text-ink-muted">Picked by you</span>}
            {field.evidence.length > 0 && <CiteButtons evidence={field.evidence} />}
          </div>
        )}
        {missing && !field.conflictOptions && <p className="mt-0.5 text-xs text-ink-muted">Typing it counts as a field typed by hand.</p>}
      </div>
      {!missing && !editing && (
        <div className="flex items-center gap-4">
          <Tick checked={field.confirmed} onChange={(v) => actions.confirmCore(field.key, v)} label="Confirm" disabled={submitted} tour={`confirm-${field.key}`} />
          {!submitted && field.source !== "picked" && (
            <button className="min-h-11 px-2 text-xs text-teal hover:underline" onClick={() => { setEditing(true); setDraft(""); }}>
              Change
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TermRow({ term }: { term: TermView }) {
  const [open, setOpen] = useState(term.status === "conflict");
  const [marking, setMarking] = useState(false);
  const submitted = useApp((s) => !!s.deals[s.dealId].submit.requestId);
  const canConfirm = term.status === "accepted" || term.status === "offEmail";
  return (
    <div className="border-b border-line py-1.5" data-tour={`term-${term.key}`}>
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1" data-tour={`term-head-${term.key}`}>
        <button className="flex w-full shrink-0 items-center gap-1 text-left text-small text-ink-muted hover:text-ink sm:w-40" onClick={() => setOpen(!open)} aria-expanded={open} data-tour={`toggle-${term.key}`}>
          {open ? <ChevronDown size={14} strokeWidth={1.5} aria-hidden /> : <ChevronRight size={14} strokeWidth={1.5} aria-hidden />}
          {term.label}
        </button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <StatusBadge status={term.status} />
          {term.value && <span className="text-small text-ink">{term.value}</span>}
          {term.status === "openForLegal" && term.resolution?.type === "open" && <span className="truncate text-xs text-ink-muted">{term.resolution.reason} · owner {term.resolution.owner}</span>}
          {term.goesToLegalOpen && term.status !== "openForLegal" && <span className="text-xs text-ink-muted">Goes to Legal as open · owner {term.openOwner}</span>}
        </div>
        {canConfirm && (
          <Tick checked={term.confirmed} onChange={(v) => actions.confirmTerm(term.key, v)} label="Confirm evidence" disabled={submitted} tour={`confirm-${term.key}`} />
        )}
      </div>
      {(term.heldBackReason || term.claimNote) && (
        <p className="ml-[172px] flex items-start gap-1.5 text-xs text-ink" data-tour={`held-${term.key}`}>
          <AlertTriangle size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
          {term.heldBackReason ?? term.claimNote}
          <HonestyChip kind="live" className="ml-1" />
        </p>
      )}
      {open && (
        <div className="ml-0 mt-2 rounded-card bg-surface-alt p-3 fade-in md:ml-[172px]">
          {term.conflict && !term.resolution && <ConflictView term={term} />}
          <Timeline term={term} />
          <Checks term={term} />
          {!submitted && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-2">
              {term.resolution && (
                <Button size="sm" variant="ghost" onClick={() => actions.resolveTerm(term.key, undefined)} icon={<RotateCcw size={14} strokeWidth={1.5} aria-hidden />}>
                  Undo decision
                </Button>
              )}
              {term.status !== "openForLegal" && (
                <Button size="sm" variant="secondary" onClick={() => setMarking(true)} icon={<Flag size={14} strokeWidth={1.5} aria-hidden />} data-tour={`mark-open-${term.key}`}>
                  Mark open for Legal
                </Button>
              )}
            </div>
          )}
          {marking && <MarkOpen term={term} onDone={() => setMarking(false)} />}
        </div>
      )}
    </div>
  );
}

function ConflictView({ term }: { term: TermView }) {
  return (
    <div className="mb-3" data-tour={`conflict-${term.key}`}>
      <p className="mb-2 text-small text-ink">The added material disagrees. Resolve with evidence, or mark it open for Legal.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {term.conflict!.options.map((o, i) => (
          <div key={i} className="rounded-chip border border-line bg-white p-2">
            <div className="text-h3 text-ink">{o.value}</div>
            <div className="text-xs text-ink-muted">
              {o.author} · {fmtDate(o.date)}
            </div>
            <button className="mt-1 line-clamp-2 text-left text-xs text-ink hover:text-teal" onClick={() => actions.selectSource(o.messageId, o.quote)}>
              “{o.quote}”
            </button>
            <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => actions.resolveTerm(term.key, { type: "picked", value: o.value, messageId: o.messageId })} data-tour={`use-${term.key}-${i}`}>
              Use {o.value}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarkOpen({ term, onDone }: { term: TermView; onDone: () => void }) {
  const defaultReason = term.conflict ? `${term.conflict.options.map((o) => `${o.value} (${o.author.split(" ")[0]}, ${fmtDate(o.date)})`).join(" vs ")}. Confirm which applies.` : "";
  const [reason, setReason] = useState(defaultReason);
  const [owner, setOwner] = useState("Legal");
  return (
    <form
      className="mt-3 space-y-2 rounded-chip border border-line bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        actions.resolveTerm(term.key, { type: "open", reason: reason.trim(), owner });
        onDone();
      }}
      data-tour={`mark-open-form-${term.key}`}
    >
      <label className="block text-xs text-ink-muted">
        Reason for Legal
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 w-full rounded-chip border border-line p-2 text-small text-ink outline-none focus:border-teal" required />
      </label>
      <label className="block text-xs text-ink-muted">
        Owner
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1 min-h-11 w-full rounded-chip border border-line bg-white px-2 text-small text-ink">
          <option>Legal</option>
          <option>Procurement</option>
          <option>Supplier</option>
        </select>
      </label>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" type="submit" data-tour={`mark-open-save-${term.key}`}>
          Send to Legal as open
        </Button>
      </div>
    </form>
  );
}

function Timeline({ term }: { term: TermView }) {
  if (term.steps.length === 0)
    return (
      <p className="text-small text-ink-muted">
        Not mentioned in the added material.{term.excludedSteps ? ` ${term.excludedSteps} step${term.excludedSteps > 1 ? "s are" : " is"} in emails you have not added.` : ""}
      </p>
    );
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
        Timeline <HonestyChip kind="ai" />
      </div>
      <ol className="relative space-y-1 border-l border-line pl-4" data-tour={`timeline-${term.key}`}>
        {term.steps.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full border border-teal bg-white" aria-hidden />
            <button
              className="block w-full rounded-chip px-2 py-1 text-left hover:bg-white"
              onClick={() => actions.selectSource(s.messageId, s.quote)}
              data-tour={`step-${term.key}-${i}`}
            >
              <span className="flex flex-wrap items-center gap-2">
                <StatusBadge status={STEP_STATUS[s.role]} label={`${ROLE_LABEL[s.role]}${s.role !== "withdrawal" ? ` ${s.value}` : ""}`} />
                <span className="text-xs text-ink-muted">
                  {s.author} · {s.party === "supplier" ? "supplier" : "Halden"} · {fmtDate(s.date)}
                </span>
                {!s.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink">
                    <X size={12} strokeWidth={2} aria-hidden /> not found in source
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-ink">“{s.quote}”</span>
            </button>
          </li>
        ))}
      </ol>
      {term.excludedSteps > 0 && (
        <p className="mt-1 text-xs text-ink-muted">
          {term.excludedSteps} more step{term.excludedSteps > 1 ? "s" : ""} in emails you have not added. Add them to include them.
        </p>
      )}
    </div>
  );
}

function Checks({ term }: { term: TermView }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
        Five checks before “accepted by both” <HonestyChip kind="live" />
      </div>
      <ul className="grid gap-x-4 sm:grid-cols-2">
        {term.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-1.5 py-0.5 text-xs">
            {c.pass === true ? (
              <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-teal" aria-label="pass" />
            ) : c.pass === false ? (
              <X size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-ink" aria-label="fail" />
            ) : (
              <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line" aria-label="not applicable" />
            )}
            <span>
              <span className="text-ink">
                {c.id}. {c.label}.
              </span>{" "}
              <span className="text-ink-muted">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoveragePanel() {
  const view = useDealView();
  const [open, setOpen] = useState(false);
  const c = view.coverage;
  return (
    <section className="border-b border-line bg-surface-alt px-4 py-1.5" aria-label="Coverage" data-tour="coverage">
      <button className="flex min-h-9 w-full flex-wrap items-center gap-x-4 gap-y-1 text-left text-xs text-ink" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex items-center gap-1 text-ink-muted">
          {open ? <ChevronDown size={13} strokeWidth={1.5} aria-hidden /> : <ChevronRight size={13} strokeWidth={1.5} aria-hidden />} Coverage
        </span>
        <span>
          {c.messagesRead} emails, {c.pdfsRead} PDF{c.pdfsRead === 1 ? "" : "s"} read
        </span>
        {c.from && (
          <span>
            {fmtDate(c.from)} to {fmtDate(c.to)}
          </span>
        )}
        <span>Added by {c.addedBy.map((a) => `${a.name.split(" ")[0]} (${a.count})`).join(", ")}</span>
        {c.unreadable.length > 0 && <span className="text-ink">{c.unreadable.length} not read</span>}
        {c.latest && (
          <span className="text-ink-muted">
            Latest: {c.latest.author}, {fmtDate(c.latest.date)}
          </span>
        )}
        <HonestyChip kind="live" className="ml-auto" />
      </button>
      {open && (
        <div className="grid gap-2 pb-2 pt-1 text-xs sm:grid-cols-2 fade-in">
          {c.threads.map((t) => (
            <div key={t.id} className="rounded-chip bg-white p-2">
              <div className="text-ink">{t.label}</div>
              <div className="text-ink-muted">
                {t.added} of {t.total} items added · last added {t.lastAuthor}, {fmtDate(t.lastAdded)}
                {t.laterNotAdded > 0 && <span className="text-ink"> · {t.laterNotAdded} later email{t.laterNotAdded > 1 ? "s" : ""} not added</span>}
              </div>
            </div>
          ))}
          {c.unreadable.map((u) => (
            <div key={u.id} className="rounded-chip border border-quartz bg-white p-2">
              <div className="text-ink">Not read: {u.name}</div>
              <div className="text-ink-muted">{u.reason}</div>
            </div>
          ))}
          {c.latest && c.latest.party === "supplier" && (
            <div className="rounded-chip bg-white p-2 text-ink-muted">
              <Info size={12} strokeWidth={1.5} className="mr-1 inline" aria-hidden />
              The last word is the supplier's. Check no reply is missing before you confirm the record is complete.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SubmitBar() {
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const submitted = !!ds.submit.requestId;
  const todo = view.blockers.filter((b) => b.kind !== "record");
  return (
    <section className="mt-4 rounded-card border border-line bg-white p-4" aria-label="Submit" data-tour="submit-bar">
      {todo.length > 0 && !submitted && (
        <div className="mb-3">
          <div className="text-small text-ink">{todo.length} to do before submit</div>
          <ul className="mt-1 flex flex-wrap gap-1">
            {todo.map((b) => (
              <li key={b.label} className="rounded-pill bg-surface-alt px-3 py-0.5 text-xs text-ink">
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tick
          checked={ds.decisions.recordComplete}
          onChange={(v) => actions.setRecordComplete(v)}
          label="I confirm the deal record is complete"
          sub="Everything agreed for this deal is in the added material or logged."
          disabled={submitted}
          tour="record-complete"
        />
        {submitted ? (
          <Button variant="primary" onClick={() => actions.setView("receipt")}>
            View request {ds.submit.requestId}
          </Button>
        ) : (
          <Button variant="primary" disabled={view.blockers.length > 0} onClick={() => actions.openSubmit()} data-tour="submit">
            Submit request
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Fields typed by hand: <span className="text-ink">{view.typedByHand}</span> of 7 core fields. Open terms go to Legal marked and owned, never as agreed.
      </p>
    </section>
  );
}

function SubmitModal() {
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const status = ds.submit.status;
  const open = status === "confirming" || status === "pending" || status === "failed";
  const critical = view.core.filter((c) => ["legalEntity", "value", "termStart", "dataAccess"].includes(c.key));
  return (
    <Modal open={open} onOpenChange={(o) => !o && status !== "pending" && actions.cancelSubmit()} title="Submit to Sirion?">
      <div className="space-y-3" data-tour="submit-modal">
        <p className="text-small text-ink-muted">Check the critical values. This creates the intake request and routes it.</p>
        <dl className="divide-y divide-line rounded-chip border border-line">
          {critical.map((c) => (
            <div key={c.key} className="flex justify-between gap-3 px-3 py-2 text-small">
              <dt className="text-ink-muted">{c.label}</dt>
              <dd className="text-right text-ink">{c.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 px-3 py-2 text-small">
            <dt className="text-ink-muted">Evidenced terms</dt>
            <dd className="text-right text-ink">{view.terms.filter((t) => (t.status === "accepted" || t.status === "offEmail") && t.confirmed).map((t) => `${t.label} ${t.value}`).join("; ") || "None"}</dd>
          </div>
          <div className="flex justify-between gap-3 px-3 py-2 text-small">
            <dt className="text-ink-muted">Open for Legal</dt>
            <dd className="text-right text-ink">{view.openForLegal.map((t) => t.label).join(", ") || "None"}</dd>
          </div>
          <div className="flex justify-between gap-3 px-3 py-2 text-small">
            <dt className="text-ink-muted">Route</dt>
            <dd className="text-right text-ink">{view.route ? `${view.route.queue} (${view.route.ruleId})` : "Set on submit"}</dd>
          </div>
        </dl>
        {status === "failed" && (
          <p className="flex items-start gap-2 rounded-chip border-2 border-quartz p-2 text-small text-ink" role="alert">
            <AlertTriangle size={15} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
            {ds.submit.error}. Retry is safe: it uses the same idempotency key, so no duplicate request is created.
          </p>
        )}
        <Tick checked={ds.simulateTimeout} onChange={(v) => actions.setSimulateTimeout(v)} label="Simulate a timeout on the first try" sub="Shows the pending and failed states." disabled={status === "pending" || ds.submit.attempts > 0} />
        <div className="flex justify-between gap-3 pt-1">
          <Button variant="ghost" onClick={() => actions.cancelSubmit()} disabled={status === "pending"}>
            Back to review
          </Button>
          <Button variant="primary" onClick={() => actions.submit()} disabled={status === "pending"} data-tour="confirm-submit" icon={status === "pending" ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> : undefined}>
            {status === "pending" ? "Submitting" : status === "failed" ? "Retry submit" : "Submit request"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LogTermModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const view = useDealView();
  const candidates = view.terms.filter((t) => t.status !== "accepted");
  const [key, setKey] = useState(candidates[0]?.key ?? "");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Log a term agreed on a call">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!key || !value.trim()) return;
          actions.resolveTerm(key, { type: "offEmail", value: value.trim(), note: note.trim() });
          onOpenChange(false);
          setValue("");
          setNote("");
        }}
      >
        <p className="text-small text-ink-muted">It is marked owner-entered, not evidenced. Legal sees that.</p>
        <label className="block text-xs text-ink-muted">
          Term
          <select value={key} onChange={(e) => setKey(e.target.value)} className="mt-1 min-h-11 w-full rounded-chip border border-line bg-white px-2 text-small text-ink">
            {candidates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-ink-muted">
          Agreed value
          <input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 min-h-11 w-full rounded-chip border border-line px-3 text-small text-ink outline-none focus:border-teal" required />
        </label>
        <label className="block text-xs text-ink-muted">
          Call note (who, when)
          <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 min-h-11 w-full rounded-chip border border-line px-3 text-small text-ink outline-none focus:border-teal" />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Log as owner-entered
          </Button>
        </div>
      </form>
    </Modal>
  );
}
