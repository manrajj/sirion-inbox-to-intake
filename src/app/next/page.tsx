import { NarrativePage } from "@/components/narrative/Page";
import { NextDetails } from "@/components/narrative/NextDetails";

export const metadata = { title: "What's next · Sirion Inbox-to-Intake" };

const STAGES = [
  { n: 1, title: "Challenge set", when: "Now, before submission", what: "10 to 15 synthetic SaaS deals, labelled by two people. Three-way benchmark: manual, generic AI plus form, Inbox-to-Intake.", decide: "Ship only if the release test passes" },
  { n: 2, title: "Artifact discovery", when: "First step with a real customer", what: "3 to 5 owner walkthroughs of their last deal, timed. Audit 10 to 15 permissioned deals for omitted or wrong terms.", decide: "Continue only if working out what was agreed, not finding documents, is the burden" },
  { n: 3, title: "Supervised shadow trial", when: "Live eligible deals", what: "The sidebar runs beside the manual process; owners do not submit from it. Measure time, fields typed, critical errors, planted-error catch rate.", decide: "Continue only if zero wrong critical values reach a brief and time beats manual" },
  { n: 4, title: "Comparative pilot", when: "After the shadow trial", what: "Alternate deals within each owner between sidebar and manual. Report only matured cohorts.", decide: "Sample sized from observed volume, set before the pilot" },
];

const DEFERRED = ["Real Outlook add-in and Gmail add-on", "Live Sirion integration", "Scanned PDFs (OCR)", "Excel parsing", "Translation", "Multiple currencies", "Position checks against preferred and fallback positions (negotiation stage)"];

export default function Page() {
  return (
    <NarrativePage eyebrow="What's next" title="Learn in four steps, each ending in a decision" next={{ href: "/sources/", label: "Sources" }}>
      <ol className="grid gap-3 md:grid-cols-4">
        {STAGES.map((s) => (
          <li key={s.n} className="flex flex-col rounded-card border border-line p-4">
            <div className="text-xs text-ink-muted">Stage {s.n} · {s.when}</div>
            <h2 className="mt-1 text-h3 text-ink">{s.title}</h2>
            <p className="mt-1 flex-1 text-small text-ink-muted">{s.what}</p>
            <p className="mt-2 border-t border-line pt-2 text-small text-teal">{s.decide}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <section className="rounded-card bg-surface-alt p-4" aria-label="Deferred">
          <h2 className="text-h3 text-ink">Deferred from v1, on purpose</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {DEFERRED.map((d) => (
              <li key={d} className="rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink">{d}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">No full inbox search: it would read mail the owner did not add, which IT should not have to trust.</p>
        </section>
        <NextDetails />
      </div>
    </NarrativePage>
  );
}
