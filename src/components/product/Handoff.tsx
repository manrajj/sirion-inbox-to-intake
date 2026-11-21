"use client";

import { CheckCircle2, ArrowRight, Scale, Receipt as ReceiptIcon, MessageSquareReply, FileSignature, Quote } from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { getDeal } from "@data/index";
import { buildPayload, reasonFor } from "@/lib/derive";
import { Button, Card, HonestyChip, StatusBadge, Tabs, fmtDate, cx } from "@/components/ui";
import { SourceMessage } from "./SourceText";
import { useState } from "react";

export function Receipt() {
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const p = buildPayload(view);
  return (
    <div className="thin-scroll h-full overflow-y-auto p-6" data-tour="receipt">
      <div className="mx-auto max-w-[880px]">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <CheckCircle2 size={28} strokeWidth={1.5} className="text-teal" aria-hidden />
          <h2 className="text-h1 text-ink">
            Request <span className="text-teal">{ds.submit.requestId}</span> created
          </h2>
          <HonestyChip kind="mocked" title="Mock Sirion request" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs text-ink-muted">Route</div>
            <div className="mt-1 text-h3 text-ink">{p.route?.queue ?? "Legal intake"}</div>
            <div className="mt-1 text-xs text-ink-muted">Rule that fired: {p.route?.rule}. Legal owns the rules.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-ink-muted">Core fields typed by hand</div>
            <div className="mt-1 text-big text-teal" style={{ fontSize: 44, lineHeight: "44px" }} data-tour="typed-count">
              {p.typedByHand}
              <span className="text-h2 text-ink-muted"> of 7</span>
            </div>
            <div className="mt-1 text-xs text-ink-muted">Counts toward the clean intake rate.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-ink-muted">Submitted</div>
            <div className="mt-1 text-h3 text-ink">{fmtDate(ds.audit.find((a) => a.action === "Submitted")?.at, true)}</div>
            <div className="mt-1 text-xs text-ink-muted">
              {ds.submit.attempts} attempt{ds.submit.attempts > 1 ? "s" : ""}, one request. Idempotency key {view.deal.id}-intake.
            </div>
          </Card>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-h3 text-ink">
              <Scale size={16} strokeWidth={1.5} className="text-teal" aria-hidden /> Legal received
            </div>
            <ul className="space-y-1 text-small text-ink">
              <li>{p.evidenced.length} evidenced terms, each with its sources</li>
              <li>{p.open.length} open items, each with an owner and a reason</li>
              <li>Contract type suggestion: {p.contractTypeSuggestion} (Legal decides)</li>
              <li>Evidence bundle: {p.sources.length} items</li>
            </ul>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-h3 text-ink">
              <ReceiptIcon size={16} strokeWidth={1.5} className="text-teal" aria-hidden /> Finance received
            </div>
            <p className="text-small text-ink">A reference pack: rate card, uplift cap, payment terms and renewal date as evidenced.</p>
            <p className="mt-1 text-xs text-ink-muted">Reference, not permission to pay. The signed contract governs payment.</p>
          </Card>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => actions.setView("review")}>
            Back to review
          </Button>
          <Button variant="primary" onClick={() => actions.setView("legal")} icon={<ArrowRight size={16} strokeWidth={1.5} aria-hidden />} data-tour="open-legal">
            Open Legal's view
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LegalView() {
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const view = useDealView();
  const deal = getDeal(dealId);
  const p = buildPayload(view);
  const [src, setSrc] = useState<{ messageId: string; quote?: string } | null>(null);
  const srcMsg = src ? deal.messages.find((m) => m.id === src.messageId) : undefined;
  const evidencedTerms = view.terms.filter((t) => (t.status === "accepted" || t.status === "offEmail") && t.confirmed);
  const openTerms = view.terms.filter((t) => !evidencedTerms.includes(t));

  const brief = (
    <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <section aria-label="Evidenced terms" data-tour="legal-evidenced">
          <h3 className="mb-1 text-h3 text-teal">Evidenced commercial position</h3>
          <ul className="divide-y divide-line rounded-card border border-line bg-white">
            {evidencedTerms.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="w-44 text-small text-ink-muted">{t.label}</span>
                <span className="flex-1 text-small text-ink">{t.value}</span>
                <StatusBadge status={t.status} />
                <span className="flex gap-1">
                  {(t.status === "offEmail" ? [] : t.steps).map((s, i) => (
                    <button key={i} onClick={() => setSrc({ messageId: s.messageId, quote: s.quote })} className="inline-flex h-7 items-center gap-0.5 rounded-chip border border-line px-1.5 text-xs text-ink-muted hover:text-teal" aria-label={`Source ${i + 1} for ${t.label}`}>
                      <Quote size={11} strokeWidth={1.75} aria-hidden />
                      {i + 1}
                    </button>
                  ))}
                </span>
              </li>
            ))}
            {evidencedTerms.length === 0 && <li className="px-3 py-2 text-small text-ink-muted">None confirmed.</li>}
          </ul>
        </section>
        <section aria-label="Open items" data-tour="legal-open">
          <h3 className="mb-1 text-h3 text-teal">Open items</h3>
          <ul className="divide-y divide-line rounded-card border border-line bg-white">
            {openTerms.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="w-44 text-small text-ink-muted">{t.label}</span>
                <span className="flex-1 text-small text-ink">{t.resolution?.type === "open" ? t.resolution.reason : reasonFor(t)}</span>
                <StatusBadge status={t.status === "openForLegal" ? "openForLegal" : t.status} />
                <span className="text-xs text-ink-muted">Owner: {t.openOwner}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Paper" className="rounded-card border border-line bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-ink-muted">Suggested paper</span>
            <span className="text-small text-ink">{view.contractType.suggestion}</span>
            <HonestyChip kind="ai" />
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {view.contractType.reason} {view.repository.matches[0] ? `${view.repository.matches[0].id}, signed ${fmtDate(view.repository.matches[0].signed)} ${view.repository.matches[0].signed.slice(0, 4)}.` : ""} You decide.
          </p>
        </section>
      </div>
      <aside className="rounded-card border border-line bg-surface-alt p-3" aria-label="Source">
        {srcMsg ? <SourceMessage message={srcMsg} quote={src?.quote} /> : <p className="text-small text-ink-muted">Click a source number to read the sentence it came from.</p>}
      </aside>
    </div>
  );

  const bundle = (
    <ul className="grid gap-2 pt-4 md:grid-cols-2">
      {view.added.map((a) => {
        const m = deal.messages.find((x) => x.id === a.messageId)!;
        return (
          <li key={a.messageId}>
            <button onClick={() => setSrc({ messageId: m.id })} className="block w-full rounded-card border border-line bg-white p-3 text-left hover:bg-surface-alt">
              <div className="truncate text-small text-ink">{m.kind === "pdf" ? m.filename : m.subject}</div>
              <div className="text-xs text-ink-muted">
                {m.from.name} · {fmtDate(m.date)} · added by {a.addedBy}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const ref = (key: string) => view.terms.find((t) => t.key === key);
  const finance = (
    <div className="pt-4" data-tour="finance-pack">
      <p className="mb-3 rounded-chip bg-surface-alt px-3 py-2 text-small text-ink">Reference, not permission to pay. The signed contract governs payment.</p>
      <dl className="grid gap-2 md:grid-cols-2">
        {[
          ["Rate card", p.core.value ?? "Not evidenced"],
          ["Uplift cap", ref("uplift")?.confirmed ? ref("uplift")!.value : "Open"],
          ["Payment terms", ref("payment")?.confirmed && ref("payment")?.value ? ref("payment")!.value : "Open for Legal"],
          ["Renewal date", p.core.termStart ?? "Not evidenced"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-card border border-line bg-white p-3">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="text-h3 text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="thin-scroll h-full overflow-y-auto p-6" data-tour="legal">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-h1 text-ink">Legal intake: {ds.submit.requestId}</h2>
          <HonestyChip kind="mocked" />
          <span className="text-small text-ink-muted">
            {deal.supplier.legalEntity} · from {deal.owner.name} · {view.route?.queue}
          </span>
        </div>
        <Tabs
          className="mt-3"
          tabs={[
            { id: "brief", label: "Brief", content: brief },
            { id: "bundle", label: `Evidence bundle (${view.added.length})`, content: bundle },
            { id: "finance", label: "Finance reference pack", content: finance, tour: "tab-finance" },
          ]}
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {ds.legalDecision ? (
            <p className="text-small text-ink" role="status">
              Recorded: {ds.legalDecision === "start" ? "Legal started drafting without asking for context." : "Legal asked procurement for more context."} This is the second half of the north star.
            </p>
          ) : (
            <p className="text-small text-ink-muted">Legal's choice is recorded. It is the second half of the north star.</p>
          )}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => actions.legalDecide("ask")} icon={<MessageSquareReply size={16} strokeWidth={1.5} aria-hidden />} disabled={!!ds.legalDecision}>
              Ask procurement
            </Button>
            <Button variant="primary" onClick={() => actions.legalDecide("start")} icon={<FileSignature size={16} strokeWidth={1.5} aria-hidden />} disabled={!!ds.legalDecision} data-tour="start-drafting">
              Start drafting
            </Button>
          </div>
        </div>
        {dealId === "DL-1042" && ds.legalDecision && (
          <div className={cx("mt-4 flex justify-end fade-in")}>
            <Button variant="ghost" onClick={() => actions.setView("record")} icon={<ArrowRight size={16} strokeWidth={1.5} aria-hidden />} data-tour="open-record">
              One year later: the contract record
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
