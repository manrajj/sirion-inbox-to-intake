"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, PanelRight, FileCheck2, Send, Check, Hand, Ban, Sparkles, Target, ShieldCheck, Gauge } from "lucide-react";
import { SirionLogo } from "./SirionMark";
import { cx } from "@/components/ui";

// "About this prototype": the brief's narrative in plain words, as one full page at
// /about/, linked from the tab beside "Watch walkthrough" and from the end of the film.

const TOC = [
  { id: "why", label: "Why intake" },
  { id: "who", label: "Who it is for" },
  { id: "problem", label: "The problem" },
  { id: "stakeholders", label: "Stakeholder map" },
  { id: "autonomy", label: "How much it does" },
  { id: "assumptions", label: "Assumptions" },
  { id: "metrics", label: "How we would measure it" },
];

const FLOW = [
  { icon: Mail, title: "Deal agreed in email", body: "Six emails and a quote PDF with the supplier." },
  { icon: PanelRight, title: "Open Sirion in Outlook", body: "One click starts a draft intake request from the thread." },
  { icon: FileCheck2, title: "Filled in and quoted", body: "Every value shows the sentence it came from. Edit anything." },
  { icon: Send, title: "Submit in Sirion", body: "Your click. The request goes to Legal, nothing retyped." },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          <SirionLogo size={20} />
          <span className="hidden text-small text-ink-muted sm:inline">About this prototype</span>
          <Link href="/" className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-button bg-teal px-4 text-small text-white hover:opacity-90" data-tour="about-back">
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden /> Back to the prototype
          </Link>
        </div>
      </header>

      <div>
        {/* Hero */}
        <section className="bg-teal text-white">
          <div className="mx-auto max-w-[1120px] px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
            <p className="text-small text-white/80">Sirion APM case · Prototype</p>
            <h1 className="mt-3 max-w-[760px] text-[32px] font-medium leading-[38px] tracking-tight sm:text-[44px] sm:leading-[50px]">
              Raise a Sirion intake request straight from the email trail.
            </h1>
            <p className="mt-4 max-w-[640px] text-lead text-white/90">
              Procurement agrees the deal over email. This add-in turns that trail into a Sirion intake request, with a source for every value, so nothing is retyped.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-button bg-white px-5 text-body text-teal hover:opacity-90">
                Try the prototype <ArrowRight size={17} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* The flow in four steps */}
        <section aria-label="The flow" className="mx-auto -mt-8 max-w-[1120px] px-4 sm:px-6">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((f, i) => (
              <li key={f.title} className="relative rounded-card bg-white p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-tone-success-bg text-teal">
                    <f.icon size={17} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-xs text-ink-muted">Step {i + 1}</span>
                </div>
                <h2 className="mt-3 text-h3 font-medium">{f.title}</h2>
                <p className="mt-1 text-small text-ink-muted">{f.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[200px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <ol className="sticky top-24 space-y-1 text-small">
              {TOC.map((t, i) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="flex min-h-9 items-center gap-2 rounded-chip px-2 text-ink-muted hover:bg-white hover:text-ink">
                    <span className="w-4 text-xs">{i + 1}</span>
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 space-y-14">
            <Part id="why" n={1} title="Why intake">
              <p className="text-lead">
                The brief&apos;s later problems, such as missed renewals, missed service levels and invoices that don&apos;t match the price, often start at intake.
              </p>
              <p className="mt-3 text-body text-ink-muted">
                A term that is lost or retyped wrongly when the request is raised stays wrong for the life of the contract. Get the request right at the start, and the record is right from then on.
              </p>
            </Part>

            <Part id="who" n={2} title="Who it is for">
              <div className="grid gap-3 md:grid-cols-3">
                <Card tag="Main user" title="The procurement manager" accent>
                  They turn the email trail into a Sirion request. That handoff is where intake breaks. A customer we interviewed said these users live in Outlook and Word, not in Sirion.
                </Card>
                <Card tag="Second user" title="Legal">
                  They receive the request. A complete request, with a source for every value, means fewer questions back.
                </Card>
                <Card tag="Also affected" title="The business requester">
                  They send the emails, but procurement raises the request. Finance and the supplier appear only as email senders.
                </Card>
              </div>
            </Part>

            <Part id="problem" n={3} title="The problem">
              <div className="rounded-card bg-white p-6 shadow-card">
                <p className="text-lead">
                  To raise a request today, the procurement manager retypes the deal from email into Sirion&apos;s form, switching between apps and losing context on the way.
                </p>
                <p className="mt-4 text-small text-ink-muted">Our evidence so far: an interview with a customer, input from an outside counsel, and published industry research.</p>
              </div>
            </Part>

            <Part id="stakeholders" n={4} title="Stakeholder map">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Procurement manager", "Wants the request raised fast."],
                  ["Legal", "Wants proof of what was agreed before drafting."],
                  ["Business requester", "Wants the tool bought soon."],
                  ["Finance", "Wants the spend inside budget."],
                ].map(([who, want]) => (
                  <div key={who} className="rounded-card bg-white p-5 shadow-card">
                    <p className="text-small text-ink-muted">{who}</p>
                    <p className="mt-1 text-body">{want}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-card border-l-4 border-amethyst bg-white p-5 shadow-card">
                <p className="text-small font-medium text-amethyst">The key tension</p>
                <p className="mt-1 text-body">
                  Procurement&apos;s need for speed against Legal&apos;s need for evidence. A source on every value serves both.
                </p>
              </div>
            </Part>

            <Part id="autonomy" n={5} title="How much the product does">
              <p className="mb-4 text-body text-ink-muted">
                It makes it easy for the procurement manager to create a Sirion intake request, and it helps them make informed decisions: it shows what was agreed and where each value came from.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Card icon={Sparkles} tag="Does on its own" title="Reads and fills in">
                  Reads the emails you add and fills in the request, each value with its source. Every value can be checked in one click.
                </Card>
                <Card icon={Hand} tag="Suggests, you decide" title="Which threads belong">
                  It never adds an email from another supplier without warning you, because a wrong thread would put a wrong term under your name. You can edit any value.
                </Card>
                <Card icon={Ban} tag="Never on its own" title="Submitting">
                  Submitting the request is always your click.
                </Card>
              </div>
            </Part>

            <Part id="assumptions" n={6} title="Assumptions">
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  "The company already uses Sirion, with an intake form.",
                  "Staff use Microsoft 365 and IT allows Outlook add-ins. The same add-in can work in Gmail.",
                  "Procurement compares supplier quotes over email before picking one supplier.",
                  "A procurement manager works on several purchases at once, so each email needs to be tied to the right request.",
                  "All data in this prototype is made up.",
                ].map((a) => (
                  <li key={a} className="flex items-start gap-2.5 rounded-card bg-white p-4 text-small shadow-card">
                    <Check size={16} strokeWidth={2} className="mt-[1px] shrink-0 text-teal" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </Part>

            <Part id="metrics" n={7} title="How we would measure it">
              <div className="rounded-card bg-teal p-6 text-white shadow-card">
                <p className="flex items-center gap-2 text-small text-white/80">
                  <Target size={16} strokeWidth={1.75} aria-hidden /> North star
                </p>
                <p className="mt-2 text-h2">Clean intake rate</p>
                <p className="mt-2 max-w-[640px] text-body text-white/90">
                  The share of requests submitted with no core field typed by hand that Legal accepts the first time.
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-card bg-white p-5 shadow-card">
                  <p className="flex items-center gap-2 text-small font-medium text-teal">
                    <ShieldCheck size={16} strokeWidth={1.75} aria-hidden /> Guardrails
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Must not get worse</p>
                  <ul className="mt-3 space-y-2.5 text-small">
                    <Li>Wrong values that reach Legal. The target is zero.</Li>
                    <Li>Time to raise a request. It should go down, never up.</Li>
                    <Li>Legal&apos;s time to start drafting. Faster requests must not slow Legal down.</Li>
                  </ul>
                </div>
                <div className="rounded-card bg-white p-5 shadow-card">
                  <p className="flex items-center gap-2 text-small font-medium text-amethyst">
                    <Gauge size={16} strokeWidth={1.75} aria-hidden /> Counter metrics
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Catch the north star looking good for the wrong reason</p>
                  <ul className="mt-3 space-y-2.5 text-small">
                    <Li>How often procurement managers change a value Sirion filled in. If this rises, the AI is getting things wrong.</Li>
                    <Li>Requests sent with fields left empty. A low &quot;typed by hand&quot; count means nothing if fields are simply skipped.</Li>
                    <Li>Requests Legal sends back with questions.</Li>
                  </ul>
                </div>
              </div>
            </Part>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-6 shadow-card">
              <p className="text-body">See it work: from an Outlook thread to a Sirion request in under a minute.</p>
              <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-button bg-teal px-5 text-small text-white hover:opacity-90">
                Back to the prototype <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Part({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20" aria-labelledby={`${id}-h`}>
      <p className="text-xs font-medium uppercase tracking-wider text-teal">Part {n}</p>
      <h2 id={`${id}-h`} className="mb-4 mt-1 text-h1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ tag, title, children, accent, icon: I }: { tag: string; title: string; children: React.ReactNode; accent?: boolean; icon?: React.ElementType }) {
  return (
    <div className={cx("rounded-card bg-white p-5 shadow-card", accent && "ring-2 ring-teal")}>
      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        {I && <I size={14} strokeWidth={1.75} className="text-teal" aria-hidden />}
        {tag}
      </p>
      <p className="mt-1 text-h3 font-medium">{title}</p>
      <p className="mt-2 text-small leading-6 text-ink-muted">{children}</p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

/** The tab beside "Watch walkthrough": opens the full About page. */
export function AboutButton({ onDark, compact }: { onDark?: boolean; compact?: boolean }) {
  return (
    <Link
      href="/about/"
      data-tour="about"
      className={
        onDark
          ? "inline-flex min-h-9 items-center rounded-button border border-white px-3 text-small text-white hover:opacity-90"
          : "inline-flex min-h-9 items-center rounded-button border border-amethyst px-3 text-small text-amethyst hover:bg-white"
      }
    >
      {compact ? (
        "About"
      ) : (
        <>
          <span className="sm:hidden">About</span>
          <span className="hidden sm:inline">About this prototype</span>
        </>
      )}
    </Link>
  );
}
