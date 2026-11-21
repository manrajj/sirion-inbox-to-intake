import { ArrowRight, Inbox, FileCheck2, PenLine } from "lucide-react";
import { NarrativePage } from "@/components/narrative/Page";

export const metadata = { title: "Why intake · Sirion Inbox-to-Intake" };

const POINTS = [
  { icon: Inbox, title: "The brief names it", body: "“Requests get lost, approvals stall.” Requests start in email and lose detail on the way into the system." },
  { icon: FileCheck2, title: "Sirion covers what comes after", body: "Negotiation of the document (Word add-in, version control, redline history) and post-signature work (repository, obligations, renewals)." },
  { icon: PenLine, title: "The handoff is still manual", body: "Getting the deal out of email and into an intake request is retyping. Errors made there carry through every later stage." },
];

const CHAIN = [
  { lost: "“4% uplift if you drop the setup fee” keyed as the 6% list uplift", follows: "Legal drafts the contract at 6%", loss: "Invoices that don't match the agreed price" },
  { lost: "A renewal price cap agreed in email, never captured", follows: "No cap in the signed contract", loss: "An unreviewed autorenewal at a higher price" },
  { lost: "An SLA credit agreed in email, left out", follows: "No credit clause", loss: "Missed service levels with nothing to claim" },
];

export default function Page() {
  return (
    <NarrativePage eyebrow="Brief item 1 · Why this stage" title="Fix the brief's losses where they start" next={{ href: "/problem/", label: "The problem" }}>
      <div className="grid gap-4 md:grid-cols-3">
        {POINTS.map((p) => (
          <section key={p.title} className="rounded-card border border-line p-5 bg-white shadow-card">
            <p.icon size={20} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
            <h2 className="mt-2 text-h3 text-ink">{p.title}</h2>
            <p className="mt-1 text-small text-ink-muted">{p.body}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-card p-5 bg-white shadow-card" aria-label="How a term lost at intake becomes the brief's losses">
        <h2 className="text-h2 text-ink">How a term lost at intake becomes the brief's losses</h2>
        <div className="mt-1 hidden grid-cols-[1fr_24px_1fr_24px_1fr] gap-2 text-xs text-ink-muted md:grid">
          <span>Lost at intake</span>
          <span />
          <span>What follows</span>
          <span />
          <span>The brief's loss</span>
        </div>
        <ol className="mt-2 space-y-2">
          {CHAIN.map((c) => (
            <li key={c.lost} className="grid items-stretch gap-2 md:grid-cols-[1fr_24px_1fr_24px_1fr]">
              <div className="rounded-chip border border-line bg-white p-3 text-small text-ink">{c.lost}</div>
              <ArrowRight size={18} strokeWidth={1.5} className="hidden self-center text-ink-muted md:block" aria-hidden />
              <div className="rounded-chip border border-line bg-white p-3 text-small text-ink">{c.follows}</div>
              <ArrowRight size={18} strokeWidth={1.5} className="hidden self-center text-ink-muted md:block" aria-hidden />
              <div className="rounded-chip border border-line bg-white p-3 text-small text-teal">{c.loss}</div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-small text-ink-muted">The signed contract stays authoritative. The product's job is to make raising the request easy and complete.</p>
      </section>
    </NarrativePage>
  );
}
