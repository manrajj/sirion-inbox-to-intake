"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, PanelRight, FileCheck2, Send, Check, Hand, Ban, Sparkles, Target, ShieldCheck, Gauge, Quote, History, TrendingUp, RotateCcw } from "lucide-react";
import { SirionLogo } from "./SirionMark";
import { cx } from "@/components/ui";

// "About this prototype": the brief's narrative in plain words, as one full page at
// /about/, linked from the tab beside "Watch walkthrough" and from the end of the film.

const TOC = [
  { id: "why", label: "Why intake" },
  { id: "who", label: "Who it is for" },
  { id: "problem", label: "The problem" },
  { id: "evidence", label: "How we know it's real" },
  { id: "stakeholders", label: "Stakeholder map" },
  { id: "autonomy", label: "How much it does" },
  { id: "assumptions", label: "Assumptions" },
  { id: "metrics", label: "How we would measure it" },
  { id: "rethink", label: "What would make us rethink" },
];

const FLOW = [
  { icon: Mail, title: "Deal agreed in email", body: "Six emails and a quote PDF with the supplier." },
  { icon: PanelRight, title: "Open Sirion in Outlook", body: "One click starts a draft intake request from the thread." },
  { icon: FileCheck2, title: "Filled in and quoted", body: "Every value shows the sentence it came from. Edit anything." },
  { icon: Send, title: "Submit in Sirion", body: "The request goes to Legal, nothing retyped." },
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
              <p className="text-lead">The brief names it: requests get lost and approvals stall.</p>
              <div className="mt-4 rounded-card border-l-4 border-amethyst bg-white p-5 shadow-card">
                <p className="text-small font-medium text-amethyst">Hypothesis</p>
                <p className="mt-1 text-body">A term retyped wrongly at intake stays wrong for the life of the contract.</p>
              </div>
              <p className="mt-4 text-body text-ink-muted">
                The prototype turns the email trail into a structured request, routes it to Legal and Security, and tracks it under one ID.
              </p>
            </Part>

            <Part id="who" n={2} title="Who it is for">
              <div className="grid gap-3 md:grid-cols-3">
                <Card tag="Main user" title="The procurement manager" accent>
                  They turn the email trail into a Sirion request. That handoff is where intake breaks. An employee we interviewed said these users live in Outlook and Word, not in Sirion.
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

            <Part id="evidence" n={4} title="How we know it's real">
              <figure className="rounded-card bg-white p-6 shadow-card">
                <Quote size={22} strokeWidth={1.75} className="text-teal" aria-hidden />
                <blockquote className="mt-2 text-lead">
                  Most procurement contract managers live in Outlook and Word, and raising a ticket in Sirion takes them a lot of effort. Even when they do, details are missing, which adds time on the Legal side.
                </blockquote>
                <figcaption className="mt-3 text-small text-ink-muted">An employee we interviewed</figcaption>
              </figure>
              <div className="mt-3 rounded-card bg-white p-5 shadow-card">
                <p className="flex items-center gap-2 text-small font-medium text-teal">
                  Sizing <Tag>Assumed</Tag>
                </p>
                <p className="mt-2 text-body">
                  About 2,500 suppliers, with roughly 30% signing or renewing a year, gives about 750 requests a year. At about 30 minutes of retyping and chasing per request, that is about 375 hours a year, before counting errors.
                </p>
              </div>
            </Part>

            <Part id="stakeholders" n={5} title="Stakeholder map">
              <div className="rounded-card bg-white p-5 shadow-card sm:p-6" data-tour="stakeholder-map">
                <div className="flex flex-col items-stretch md:flex-row md:items-center">
                  <Node name="Business requester" want="Wants the tool bought soon." />
                  <Tension
                    title="Buying direct vs procurement"
                    fix="The add-in works on any thread, so pulling procurement in is one click."
                  />
                  <Node name="Procurement" want="Wants the request raised fast." main />
                  <Tension title="Speed vs evidence" fix="Every value carries its source." />
                  <Node name="Legal" want="Wants proof of what was agreed before drafting." />
                </div>
              </div>
              <p className="mt-3 text-small text-ink-muted">
                <b className="font-medium text-ink">Also affected:</b> Finance (budget sign-off) and the supplier (wants a quick signature).
              </p>
            </Part>

            <Part id="autonomy" n={6} title="How much the product does">
              <div className="grid gap-3 md:grid-cols-3">
                <Card icon={Sparkles} tag="Acts alone" title="Reads and fills in">
                  Reads the emails and fills each value with its source sentence. A value below 85% confidence (assumed threshold) shows &quot;Check this&quot; and is never filled silently.
                </Card>
                <Card icon={Hand} tag="Suggests, you confirm" title="Which emails belong">
                  Sirion suggests the threads for a request. You confirm each one.
                </Card>
                <Card icon={Ban} tag="Only you" title="Submitting">
                  Submitting the request.
                </Card>
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-card bg-white p-5 shadow-card">
                <History size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                <p className="text-body">
                  <b className="font-medium">Audit trail.</b> Every fill, edit and submit is logged with who did it, when, and the source.
                </p>
              </div>
              <div className="mt-3 overflow-hidden rounded-card bg-white shadow-card">
                <p className="border-b border-line px-5 py-3 text-small font-medium">What can go wrong, and the safeguard</p>
                <dl className="divide-y divide-line">
                  {[
                    ["Wrong value", "One-click source and an edit option."],
                    ["Missed term", "Required fields are flagged as empty, never guessed."],
                    ["Wrong email thread", "You confirm every thread, and the reason for each match is shown."],
                  ].map(([risk, guard]) => (
                    <div key={risk} className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr]">
                      <dt className="text-small text-ink-muted">{risk}</dt>
                      <dd className="text-small">{guard}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Part>

            <Part id="assumptions" n={7} title="Assumptions">
              <p className="mb-3 text-small text-ink-muted">Every number here is an assumption, each with the way we would test it.</p>
              <div className="overflow-hidden rounded-card bg-white shadow-card">
                <div className="hidden grid-cols-[1fr_1fr] border-b border-line px-5 py-2.5 text-xs text-ink-muted sm:grid">
                  <span>We assume</span>
                  <span>How we test it</span>
                </div>
                <ul className="divide-y divide-line">
                  {[
                    ["The procurement team has 8 people.", "Ask the pilot customer's procurement lead."],
                    ["About 60 requests a month.", "Count a month of intake requests in Sirion."],
                    ["About 70% of deals are agreed over email.", "Audit 20 recent requests for where the terms were agreed."],
                    ["Microsoft 365, with Outlook add-ins allowed.", "Confirm with the customer's IT before the pilot."],
                  ].map(([a, t]) => (
                    <li key={a} className="grid gap-1 px-5 py-3 text-small sm:grid-cols-[1fr_1fr]">
                      <span className="flex items-start gap-2">
                        <Check size={15} strokeWidth={2} className="mt-[1px] shrink-0 text-teal" aria-hidden />
                        {a}
                      </span>
                      <span className="pl-6 text-ink-muted sm:pl-0">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-xs text-ink-muted">All data in this prototype is made up.</p>
            </Part>

            <Part id="metrics" n={8} title="How we would measure it">
              <div className="rounded-card bg-teal p-6 text-white shadow-card">
                <p className="flex items-center gap-2 text-small text-white/80">
                  <Target size={16} strokeWidth={1.75} aria-hidden /> North star
                </p>
                <p className="mt-2 text-h2">Clean intake rate</p>
                <p className="mt-2 max-w-[640px] text-body text-white/90">
                  The share of requests submitted with no core field typed by hand and accepted by Legal the first time.
                </p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-pill bg-white/15 px-3 py-1 text-small">
                  Pilot target: 60% in 8 weeks <span className="text-white/75">(assumed)</span>
                </p>
              </div>
              <div className="mt-3 rounded-card bg-white p-5 shadow-card">
                <p className="flex items-center gap-2 text-small font-medium text-teal">
                  <TrendingUp size={16} strokeWidth={1.75} aria-hidden /> Input metrics <Tag>Assumed targets</Tag>
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    ["80%+", "of fields auto-filled"],
                    ["Under 5 min", "to raise a request"],
                    ["95%+", "of threads matched correctly"],
                  ].map(([n, l]) => (
                    <div key={l} className="rounded-chip bg-surface-alt p-4">
                      <p className="text-h2 text-ink">{n}</p>
                      <p className="mt-1 text-small text-ink-muted">{l}</p>
                    </div>
                  ))}
                </div>
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

            <Part id="rethink" n={9} title="What would make us rethink">
              <p className="mb-3 text-small text-ink-muted">Each threshold is an assumption, set before the pilot.</p>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Procurement managers edit more than 20% of auto-filled values after 4 weeks.", "Rethink how values are pulled from emails."],
                  ["Legal sends back more than 25% of requests for missing information.", "The form isn't capturing the right fields. Redesign it with Legal."],
                  ["Fewer than 40% of eligible deals use the add-in by week 6.", "The add-in isn't where the work happens. Find out where managers actually raise requests, and rethink the entry point."],
                ].map(([ifx, then]) => (
                  <div key={ifx} className="rounded-card bg-white p-5 shadow-card">
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <RotateCcw size={13} strokeWidth={1.75} aria-hidden /> If
                    </p>
                    <p className="mt-1 text-body">{ifx}</p>
                    <p className="mt-3 text-xs text-ink-muted">Then</p>
                    <p className="mt-1 text-small text-teal">{then}</p>
                  </div>
                ))}
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

function Node({ name, want, main }: { name: string; want: string; main?: boolean }) {
  return (
    <div className={cx("rounded-card border p-4 text-center md:w-[140px] md:shrink-0 md:px-3", main ? "border-teal bg-teal text-white" : "border-line bg-canvas")}>
      <p className="text-h3 font-medium">{name}</p>
      <p className={cx("mt-1 text-small", main ? "text-white/85" : "text-ink-muted")}>{want}</p>
    </div>
  );
}

/** A line between two stakeholders, naming the tension and how the product resolves it. */
function Tension({ title, fix }: { title: string; fix: string }) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center px-2 py-4 md:py-0">
      <span className="absolute inset-y-0 left-1/2 w-0 border-l-2 border-dashed border-amethyst md:inset-x-0 md:inset-y-auto md:left-0 md:top-1/2 md:h-0 md:w-auto md:border-l-0 md:border-t-2" aria-hidden />
      {/* An invisible copy of the note above the line keeps the label centred on it */}
      <span className="invisible mb-2 hidden max-w-[220px] px-2 text-center text-xs md:block" aria-hidden>
        {fix}
      </span>
      <span className="relative rounded-pill bg-amethyst px-3 py-1 text-center text-xs font-medium text-white">{title}</span>
      <span className="relative mt-2 max-w-[220px] bg-white px-2 text-center text-xs text-ink-muted md:bg-transparent">{fix}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-pill bg-tone-warn-bg px-2 text-xs font-normal leading-5 text-tone-warn-fg">{children}</span>;
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
