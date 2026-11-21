import Link from "next/link";
import { ArrowRight, Inbox, FileCheck2, PenLine, Film as FilmIcon } from "lucide-react";
import { NarrativePage } from "@/components/narrative/Page";

const POINTS = [
  { icon: Inbox, title: "The brief names it", body: "“Requests get lost, approvals stall.” Requests start in email and lose detail on the way into the system." },
  { icon: FileCheck2, title: "Sirion covers what comes after", body: "Negotiation of the document (Word add-in, redlines) and post-signature work (repository, obligations, renewals)." },
  { icon: PenLine, title: "The handoff is still manual", body: "Getting the deal out of email and into an intake request is retyping. Errors made there carry through every later stage." },
];

const CHAIN = [
  { lost: "“4% uplift if you drop the setup fee” keyed as the 6% list uplift", follows: "Legal drafts the contract at 6%", loss: "Invoices that don't match the agreed price" },
  { lost: "A service credit agreed in email, left out", follows: "No credit clause in the contract", loss: "Missed service levels with nothing to claim" },
];

export default function Page() {
  return (
    <NarrativePage
      eyebrow="1 of 5 · Why this stage"
      title="The deal is agreed in email. Sirion should not need it retyped."
      lead="Procurement agrees supplier deals over email, then retypes them into Sirion's intake form. A Sirion add-in in Outlook builds the request from those emails instead, with every term cited."
      next={{ href: "/stakeholders/", label: "Stakeholders" }}
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/product/" className="inline-flex min-h-11 items-center gap-2 rounded-button bg-teal px-5 text-body text-white hover:opacity-90" data-tour="try-prototype">
          Try the prototype <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
        </Link>
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/walkthrough.mp4`} className="inline-flex min-h-11 items-center gap-2 px-2 text-small text-teal underline-offset-4 hover:underline">
          <FilmIcon size={15} strokeWidth={1.5} aria-hidden /> Or watch the recording
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {POINTS.map((p) => (
          <section key={p.title} className="rounded-card bg-white p-5 shadow-card">
            <p.icon size={20} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
            <h2 className="mt-2 text-h3 text-ink">{p.title}</h2>
            <p className="mt-1 text-small text-ink-muted">{p.body}</p>
          </section>
        ))}
      </div>
      <section className="mt-4 rounded-card bg-white p-5 shadow-card" aria-label="How a term lost at intake becomes a loss later">
        <h2 className="text-h3 text-ink">How a term lost at intake becomes a loss later</h2>
        <ol className="mt-2 space-y-2">
          {CHAIN.map((c) => (
            <li key={c.lost} className="grid items-stretch gap-2 md:grid-cols-[1fr_24px_1fr_24px_1fr]">
              <div className="rounded-chip border border-line p-3 text-small text-ink">{c.lost}</div>
              <ArrowRight size={18} strokeWidth={1.5} className="hidden self-center text-ink-muted md:block" aria-hidden />
              <div className="rounded-chip border border-line p-3 text-small text-ink">{c.follows}</div>
              <ArrowRight size={18} strokeWidth={1.5} className="hidden self-center text-ink-muted md:block" aria-hidden />
              <div className="rounded-chip border border-line p-3 text-small text-teal">{c.loss}</div>
            </li>
          ))}
        </ol>
      </section>
    </NarrativePage>
  );
}
