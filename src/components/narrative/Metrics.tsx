"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Tabs, HonestyChip, cx } from "@/components/ui";
import { useApp, sessionCounters, getState } from "@/lib/store";
import { runGuardrails } from "@/lib/guardrail-suite";
import { SourceTag } from "./Page";

const INPUTS = [
  ["Time from supplier chosen to request submitted (median)", "The owner's core pain", "Below the manual baseline measured in discovery"],
  ["Core fields typed by hand per request", "Retyping is what we remove", "2 or fewer out of about 12"],
  ["Share of deal emails added from the sidebar", "The sidebar is actually the easy path", "Majority of deal emails in pilot deals"],
  ["Deal suggestions accepted, and wrong-deal attachments", "Matching helps without misfiling", "Wrong-deal attachments near zero"],
  ["Questions Legal sends back per request", "Completeness from Legal's side", "Below the manual baseline"],
];

const GUARDRAILS = [
  ["Over-deferral", "Terms marked open that an audit finds were evidenced, so marking everything open cannot inflate Legal acceptance"],
  ["Critical-value precision", "On an audited sample, so “no retyping” never means accepting wrong values"],
  ["Owner review minutes", "No higher than manual entry"],
  ["Zero open terms shown as agreed", "Checked by the submit gate on every request"],
  ["Zero attachments without a click", "Nothing is added to a deal without the owner's click"],
];

const RETHINK = [
  ["Time to submit is not faster than manual after the shadow trial", "The sidebar is not easing the job: stop"],
  ["Wrong critical values persist on the test set after two rounds of fixes", "Stop auto-filling; offer cited highlights only"],
  ["Owners say their burden is finding documents, not working out what was agreed", "Change the wedge to retrieval"],
  ["Owners keep forwarding or pasting instead of using the sidebar", "Interview them before investing more in the add-in"],
  ["Wrong-deal attachments stay above a few percent of items", "Remove deal suggestions; require the ID"],
  ["Clean intake rate does not beat the manual baseline", "Stop"],
];

const VALUE = [
  ["Low", "25% (about $7.1M)", "5%", "3%", "about $11K"],
  ["Mid", "35% (about $9.9M)", "10%", "5%", "about $50K"],
  ["High", "45% (about $12.8M)", "15%", "8%", "about $153K"],
];

export function Metrics() {
  const deals = useApp((s) => s.deals);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const counters = useMemo(() => sessionCounters(getState()), [deals]);
  const [g, setG] = useState<ReturnType<typeof runGuardrails> | null>(null);
  useEffect(() => setG(runGuardrails()), []);

  const northStar = (
    <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <section className="rounded-card border border-line p-5" aria-label="North star">
          <div className="text-xs text-ink-muted">North star</div>
          <h2 className="text-h1 text-teal">Clean intake rate</h2>
          <p className="mt-2 text-small text-ink">
            The share of eligible supplier deals submitted from the sidebar with <strong className="font-normal text-teal">no core field typed by hand</strong>, and that Legal <strong className="font-normal text-teal">starts drafting without asking</strong> Procurement for more context.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-chip bg-surface-alt p-3">
              <div className="text-xs text-ink-muted">Half 1 · the owner's ease</div>
              <div className="text-small text-ink">Requests with zero core fields typed by hand</div>
              <div className="mt-1 text-xs text-ink-muted">Recorded by the app</div>
            </div>
            <div className="rounded-chip bg-surface-alt p-3">
              <div className="text-xs text-ink-muted">Half 2 · Legal's acceptance</div>
              <div className="text-small text-ink">Requests Legal accepts first pass</div>
              <div className="mt-1 text-xs text-ink-muted">Recorded by Legal, so Procurement cannot inflate it</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Denominator: all eligible supplier deals, including those raised manually or abandoned, so leaving hard deals out of the tool lowers the score. Reported weekly as two halves, so a drop shows which side failed.
          </p>
        </section>
        <section className="flex items-start gap-3 rounded-card border border-line p-4" aria-label="Guardrail tests">
          <ShieldCheck size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal" aria-hidden />
          <div>
            <div className="text-h3 text-ink" data-tour="guardrail-count">
              Guardrail tests: {g ? `${g.wrongCaught} of ${g.wrongTotal}` : "…"} wrong outputs caught
              <span className="text-ink-muted"> · {g ? `${g.passed} of ${g.total}` : "…"} cases pass</span>
            </div>
            <p className="text-xs text-ink-muted">Run live in your browser now. In a pilot, the same suite runs against the real model, with zero wrong critical values as the release gate.</p>
          </div>
        </section>
      </div>
      <aside className="rounded-card bg-surface-alt p-4" aria-label="This session" data-tour="this-session">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-ink">This session</h3>
          <HonestyChip kind="live" />
        </div>
        <p className="mb-3 text-xs text-ink-muted">Counters from your own run of the product. Proof the metrics are instrumentable.</p>
        <dl className="grid grid-cols-2 gap-2">
          {[
            ["Fields typed by hand", counters.typed],
            ["Terms held back", counters.held],
            ["Citations verified", counters.cites],
            ["Requests submitted", counters.submitted],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-chip bg-white p-3">
              <dd className="text-[40px] leading-[44px] tracking-[-0.02em] text-teal">{v}</dd>
              <dt className="text-xs text-ink-muted">{k}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-2 rounded-chip bg-white p-3 text-xs text-ink">
          Legal decision:{" "}
          {counters.legalStart + counters.legalAsk === 0 ? (
            <span className="text-ink-muted">none yet</span>
          ) : (
            <>
              {counters.legalStart} started drafting, {counters.legalAsk} asked procurement
            </>
          )}
        </p>
        {counters.submitted === 0 && (
          <Link href="/product/" className="mt-2 inline-flex min-h-11 items-center text-small text-teal hover:underline">
            Run the main deal to fill these
          </Link>
        )}
      </aside>
    </div>
  );

  const inputs = (
    <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_380px]">
      <section aria-label="Input metrics">
        <h3 className="mb-2 text-h3 text-ink">Input metrics <span className="text-small text-ink-muted">(pilot targets are assumptions to test)</span></h3>
        <div className="thin-scroll overflow-x-auto"><table className="w-full min-w-[560px] text-left text-small">
          <thead className="bg-surface-alt text-xs text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-normal">Metric</th>
              <th className="px-3 py-2 font-normal">Why it matters</th>
              <th className="px-3 py-2 font-normal">Pilot target</th>
            </tr>
          </thead>
          <tbody>
            {INPUTS.map(([m, w, t]) => (
              <tr key={m} className="border-b border-line">
                <td className="px-3 py-2 text-ink">{m}</td>
                <td className="px-3 py-2 text-ink-muted">{w}</td>
                <td className="px-3 py-2 text-ink">{t}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      <section aria-label="Guardrails" className="rounded-card bg-surface-alt p-4">
        <h3 className="mb-2 text-h3 text-ink">Guardrails and counter metrics</h3>
        <ul className="space-y-2">
          {GUARDRAILS.map(([k, v]) => (
            <li key={k} className="text-small">
              <span className="text-ink">{k}.</span> <span className="text-ink-muted">{v}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const rethink = (
    <div className="pt-4">
      <h3 className="mb-2 text-h3 text-ink">What would make us rethink</h3>
      <ul className="grid gap-2 md:grid-cols-2">
        {RETHINK.map(([s, t]) => (
          <li key={s} className="rounded-card border border-line p-4">
            <div className="text-small text-ink">{s}</div>
            <div className="mt-1 text-small text-teal">{t}</div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">Thresholds are written before each stage's data. A protocol change is allowed only before new data, and is logged.</p>
    </div>
  );

  const measure = (
    <div className="grid gap-4 pt-4 md:grid-cols-2">
      <section className="rounded-card border border-line p-4" aria-label="Instrumented">
        <h3 className="text-h3 text-ink">What is instrumented</h3>
        <ul className="mt-2 space-y-1 text-small text-ink">
          <li>Every add: deal ID, message ID, content hash, who, when, picked or suggested</li>
          <li>Every core field: confirmed, picked or typed by hand</li>
          <li>Every term: status, owner decision, held-back reason</li>
          <li>Submit: attempts, idempotency key, route rule</li>
          <li>Legal: started drafting or asked procurement</li>
        </ul>
      </section>
      <section className="rounded-card border border-line p-4" aria-label="Pilot">
        <h3 className="text-h3 text-ink">How a pilot runs</h3>
        <ul className="mt-2 space-y-1 text-small text-ink">
          <li>Shadow trial first: the sidebar runs beside the manual process; owners do not submit from it</li>
          <li>Then alternate deals within each owner between sidebar and manual</li>
          <li>Weekly cohorts, read after 5 working days</li>
          <li>Critical values audited by two labellers</li>
        </ul>
        <p className="mt-2 text-xs text-ink-muted">At an assumed 16 requests a week, the SaaS slice may be about 5 a week, so stage 4 may only give directional evidence.</p>
      </section>
    </div>
  );

  const value = (
    <div className="pt-4">
      <p className="mb-3 text-small text-ink">
        Ease drives adoption. Avoided cost of error is the business case. Time saved alone is small (about 28 to 166 hours a year on assumed inputs), so the case does not rest on it.
      </p>
      <div className="thin-scroll overflow-x-auto"><table className="w-full min-w-[560px] text-left text-small">
        <thead className="bg-surface-alt text-xs text-ink-muted">
          <tr>
            {["Case", "Spend renegotiated or newly bought that year", "Deals with a dropped price or uplift term", "Average overpayment on those deals", "Annual cost of error"].map((h) => (
              <th key={h} className="px-3 py-2 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VALUE.map((r) => (
            <tr key={r[0]} className="border-b border-line">
              {r.map((c, i) => (
                <td key={i} className={cx("px-3 py-2", i === 4 ? "text-teal" : "text-ink")}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SourceTag type="Illustrative">every input is an assumption to measure in a pilot</SourceTag>
        <SourceTag type="Sourced">about $28M SaaS spend: Vertice $9,450 and Zylo $9,455 per employee, x 3,000</SourceTag>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        The mid case is about 250 deals averaging about $40K. For context, WorldCC's 11% average lifecycle leakage on the mid-case $9.9M would be about $1.1M; intake is only one of its causes.
      </p>
    </div>
  );

  return (
    <Tabs
      tabs={[
        { id: "ns", label: "North star", content: northStar },
        { id: "inputs", label: "Inputs and guardrails", content: inputs },
        { id: "rethink", label: "What would make us rethink", content: rethink },
        { id: "measure", label: "How we measure", content: measure },
        { id: "value", label: "Value", content: value },
      ]}
    />
  );
}


