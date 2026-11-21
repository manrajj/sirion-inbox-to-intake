import { NarrativePage, SourceTag } from "@/components/narrative/Page";
import { ProblemDetails } from "@/components/narrative/ProblemDetails";

export const metadata = { title: "Problem · Sirion Inbox-to-Intake" };

const WHO = [
  { who: "Procurement contract owner", note: "Raises the request after picking a supplier, often for several deals at once", first: true },
  { who: "Business requester", note: "Often negotiates SaaS deals directly and holds some threads" },
  { who: "Legal", note: "Inherits what is submitted" },
  { who: "Finance", note: "Pays against what is submitted" },
];

const EVIDENCE = [
  { claim: "Owners carry the agreed state from email into Sirion by hand; users live in Outlook, Gmail and Word.", type: "Reported" as const, source: "Sirion PM interview" },
  { claim: "After signing, enforcement and renegotiation suffer when the reasons behind terms are lost.", type: "Reported" as const, source: "Outside counsel interview" },
  { claim: "Organisations lose an average of 11% of contract value across the lifecycle; unrecorded changes and untracked price adjustments are named sources.", type: "Observed" as const, source: "WorldCC, Closing the procurement value gap" },
  { claim: "Only 18% of organisations use shared CLM tools across Procurement and Legal; 45% have none.", type: "Observed" as const, source: "WorldCC, CCM Institute and Agiloft, The collaboration gap, p. 12" },
];

export default function Page() {
  return (
    <NarrativePage eyebrow="Brief item 3 · The problem" title="Raising the request means retyping the deal" next={{ href: "/stakeholders/", label: "Who is involved" }}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <section aria-label="Who it affects">
            <h2 className="mb-2 text-h3 text-ink-muted">Who it affects, in order</h2>
            <ol className="grid grid-cols-2 gap-2">
              {WHO.map((w, i) => (
                <li key={w.who} className={`rounded-card border p-3 ${w.first ? "border-teal" : "border-line"}`}>
                  <div className="text-small text-ink">
                    {i + 1}. {w.who}
                  </div>
                  <div className="text-xs text-ink-muted">{w.note}</div>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-card bg-surface-alt p-4" aria-label="Core pain">
            <h2 className="text-h3 text-teal">The core pain: raising the request</h2>
            <p className="mt-1 text-small text-ink">The deal sits across several threads and attachments. The owner reopens them, works out what was finally agreed and retypes it. That is slow, and under time pressure owners submit a thin summary.</p>
          </section>
          <section className="rounded-card border border-line p-4" aria-label="Knock-on pain">
            <h2 className="text-h3 text-ink">The knock-on pain: what gets lost</h2>
            <p className="mt-1 text-small text-ink">Conditions, reversals and open items get flattened when retyped. Legal rebuilds context by email, and anything it misses lands in the contract.</p>
          </section>
        </div>
        <section aria-label="Evidence">
          <h2 className="mb-2 text-h3 text-ink-muted">Why we believe it is real, and how we will test it</h2>
          <ul className="space-y-2">
            {EVIDENCE.map((e) => (
              <li key={e.claim} className="rounded-card border border-line p-3">
                <p className="text-small text-ink">{e.claim}</p>
                <div className="mt-1.5">
                  <SourceTag type={e.type}>{e.source}</SourceTag>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-chip bg-surface-alt px-3 py-2 text-small text-ink">
            Evidence level: two interviews and industry research; no procurement owner interviewed yet.
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">The test starts with owner walkthroughs that time how long raising a request takes today.</p>
            <ProblemDetails />
          </div>
        </section>
      </div>
    </NarrativePage>
  );
}
