import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NarrativePage } from "@/components/narrative/Page";

export const metadata = { title: "Assumptions · Sirion Inbox-to-Intake" };

const ASSUMPTIONS = [
  { area: "Systems", text: "The company runs contract requests and its repository in Sirion.", test: "Confirm with the pilot customer's Sirion admin" },
  { area: "Process", text: "Supplier deals are still agreed largely in email and quotes.", test: "Owner walkthroughs of their last completed deal" },
  { area: "Systems", text: "Microsoft 365 or Google Workspace, and IT can deploy an add-in centrally.", test: "IT confirms deployment policy" },
  { area: "People", text: "Procurement owners work several deals in parallel, so a deal ID per deal is natural.", test: "Count open deals per owner" },
  { area: "Contract mix", text: "SaaS subscriptions are 20 to 40% of contract requests.", test: "Request log by category" },
  { area: "Process", text: "Some terms are agreed on calls; the product sees them only if the owner logs them.", test: "Audit of 10 to 15 deals" },
  { area: "Systems", text: "A Sirion intake form with standard fields exists, and a draft request can serve as the deal ID.", test: "Sirion intake API and form review" },
  { area: "Policy", text: "Legal owns the routing rules and the Legal-ready checklist.", test: "Legal operations signs off the rules" },
  { area: "Data", text: "All data in this prototype is synthetic.", test: "Names use fictional companies and .example domains" },
];

export default function Page() {
  return (
    <NarrativePage eyebrow="Stated assumptions" title="What we assume, and how we would check" next={{ href: "/product/", label: "Live product" }}>
      <ul className="grid gap-2 md:grid-cols-3">
        {ASSUMPTIONS.map((a, i) => (
          <li key={a.text} className="flex flex-col rounded-card border border-line p-4 bg-white shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{a.area}</span>
              <span>A{i + 1}</span>
            </div>
            <p className="mt-1 flex-1 text-small text-ink">{a.text}</p>
            <p className="mt-2 border-t border-line pt-2 text-xs text-ink-muted">Test: {a.test}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card p-4 bg-white shadow-card">
        <p className="text-small text-ink">The biggest risk is that the problem is smaller than assumed. The learning plan tests that first.</p>
        <Link href="/next/" className="inline-flex min-h-11 items-center gap-2 text-small text-teal hover:underline">
          See the learning plan <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
    </NarrativePage>
  );
}
