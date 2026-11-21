"use client";

import { useState } from "react";
import { AlertTriangle, History, ArrowLeft, Quote } from "lucide-react";
import { actions } from "@/lib/store";
import { getDeal, EXAMPLES } from "@data/index";
import { citationExists } from "@/lib/checks";
import { Button, HonestyChip, StatusBadge, STEP_STATUS, fmtDate, cx } from "@/components/ui";
import { SourceMessage } from "./SourceText";

const CLAUSES = [
  { id: "2.1", title: "Subscription", text: "Brightline grants Halden access to the Brightline Insights platform for 25 named users for 12 months from 1 December 2026." },
  { id: "3.1", title: "Fees", text: "Halden will pay an annual subscription fee of $48,000. No setup fee is payable." },
  { id: "3.2", title: "Annual uplift", text: "On each anniversary, fees may increase by no more than 4% of the fees for the previous year.", trail: true },
  { id: "3.3", title: "Payment", text: "Invoices are payable within 45 days of the invoice date." },
  { id: "5.1", title: "Service levels", text: "Brightline will make the platform available 99.9% of each month. For each month below 99.9%, Brightline will credit 5% of that month's fee." },
];

export function ContractRecord() {
  const deal = getDeal("DL-1042");
  const uplift = EXAMPLES["DL-1042"].terms.find((t) => t.key === "uplift")!;
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const [src, setSrc] = useState<{ messageId: string; quote: string } | null>(null);
  const [trailOpen, setTrailOpen] = useState(true);
  const srcMsg = src ? byId.get(src.messageId) : undefined;

  return (
    <div className="thin-scroll h-full overflow-y-auto p-6" data-tour="record">
      <div className="mx-auto max-w-[1160px]">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => actions.setView("legal")} icon={<ArrowLeft size={15} strokeWidth={1.5} aria-hidden />}>
            Legal view
          </Button>
          <h2 className="text-h1 text-ink">Contract record, one year later</h2>
          <HonestyChip kind="mocked" />
        </div>
        <p className="mb-4 text-small text-ink-muted">
          Order form OF-2026-0412 under MSA-2025-0187 · Brightline Analytics Ltd · signed 28 Nov 2026 · today is 4 Dec 2027
        </p>

        <div className="mb-4 flex flex-wrap items-start gap-3 rounded-card border-2 border-quartz bg-white p-4" role="alert" data-tour="invoice-flag">
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-h3 text-ink">Invoice INV-BL-30551 charges a 6% uplift</div>
            <p className="text-small text-ink">
              Year-two fee invoiced: <strong className="font-normal text-ink">$50,880</strong>. Clause 3.2 caps it at 4%: <span className="text-teal">$49,920</span>. Difference: $960.
            </p>
            <p className="mt-1 text-xs text-ink-muted">Illustrative mock. Invoice checks are a later Sirion stage; this shows why the deal trail matters there.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <section aria-label="Clauses" className="rounded-card border border-line bg-white">
            {CLAUSES.map((c) => (
              <div key={c.id} className={cx("border-b border-line p-4 last:border-b-0", c.trail && "bg-surface-alt")} data-tour={c.trail ? "clause-uplift" : undefined}>
                <div className="flex items-center gap-2">
                  <span className="text-small text-teal">{c.id}</span>
                  <span className="text-small text-ink">{c.title}</span>
                  {c.trail && (
                    <button className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-chip border border-line bg-white px-2 text-xs text-teal" onClick={() => setTrailOpen(!trailOpen)} aria-expanded={trailOpen} data-tour="deal-trail-toggle">
                      <History size={13} strokeWidth={1.5} aria-hidden /> Deal trail
                    </button>
                  )}
                </div>
                <p className="mt-1 text-small text-ink">{c.text}</p>
              </div>
            ))}
          </section>

          <aside aria-label="Deal trail" className="space-y-3">
            {trailOpen && (
              <section className="rounded-card border border-line bg-white p-4 fade-in" data-tour="deal-trail">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <History size={15} strokeWidth={1.5} className="text-teal" aria-hidden />
                  <h3 className="text-h3 text-ink">Deal trail for 3.2</h3>
                  <HonestyChip kind="mocked" />
                </div>
                <p className="mb-2 text-xs text-ink-muted">Why the cap is 4%: the commercial deal before any draft existed.</p>
                <ol className="space-y-1 border-l border-line pl-3">
                  {uplift.steps.map((s, i) => {
                    const m = byId.get(s.messageId)!;
                    const ok = citationExists(s.quote, m);
                    return (
                      <li key={i}>
                        <button className="block w-full rounded-chip px-1 py-1 text-left hover:bg-surface-alt" onClick={() => setSrc({ messageId: s.messageId, quote: s.quote })}>
                          <span className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={STEP_STATUS[s.role]} label={`${s.value}`} />
                            <span className="text-xs text-ink-muted">
                              {m.from.name.split(" ")[0]}, {fmtDate(m.date)}
                            </span>
                            {ok && <Quote size={11} strokeWidth={1.75} className="text-ink-muted" aria-label="verified citation" />}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink">“{s.quote}”</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 rounded-chip bg-surface-alt p-2 text-xs text-ink">
                  Sirion's redline history shows how the wording of 3.2 changed. The deal trail shows why the number is 4%: it was traded for waiving the $5,000 setup fee.
                </p>
              </section>
            )}
            {srcMsg && (
              <section className="rounded-card border border-line bg-surface-alt p-4 fade-in">
                <SourceMessage message={srcMsg} quote={src?.quote} />
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
