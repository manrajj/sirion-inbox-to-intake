"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui";

// "About this prototype": the brief's narrative in plain words, one scroll, opened
// from the tab beside "Watch walkthrough". The full pages stay at /why/ and friends.

const EVENT = "open-about";
export const openAbout = () => window.dispatchEvent(new Event(EVENT));

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Why intake",
    body: (
      <>
        <p>
          The brief&apos;s later problems (missed renewals, missed service levels, invoices that don&apos;t match the price) often start at intake. A term that is lost or retyped
          wrongly when the request is raised stays wrong for the life of the contract.
        </p>
        <p>Get the request right at the start, and the record is right from then on.</p>
      </>
    ),
  },
  {
    title: "Who it is for",
    body: (
      <ul>
        <li>
          <b>Main user: the procurement manager.</b> They turn the email trail into a Sirion request. That handoff is where intake breaks. A customer we interviewed said these
          users live in Outlook and Word, not in Sirion.
        </li>
        <li>
          <b>Second user: Legal.</b> They receive the request. A complete request, with a source for every value, means fewer questions back.
        </li>
        <li>
          <b>Also affected: the business person who asked for the purchase.</b> They send the emails, but the procurement manager raises the request. Finance and the
          supplier appear only as email senders.
        </li>
      </ul>
    ),
  },
  {
    title: "The problem",
    body: (
      <>
        <p>To raise a request today, the procurement manager retypes the deal from email into Sirion&apos;s form, switching between apps and losing context on the way.</p>
        <p>Our evidence so far: an interview with a customer, input from an outside counsel, and published industry research.</p>
      </>
    ),
  },
  {
    title: "Stakeholder map",
    body: (
      <ul>
        <li>
          <b>Procurement manager:</b> wants the request raised fast.
        </li>
        <li>
          <b>Legal:</b> wants proof of what was agreed before drafting.
        </li>
        <li>
          <b>Business requester:</b> wants the tool bought soon.
        </li>
        <li>
          <b>Finance:</b> wants the spend inside budget.
        </li>
        <li>
          <b>The key tension:</b> procurement&apos;s need for speed against Legal&apos;s need for evidence. A source on every value serves both.
        </li>
      </ul>
    ),
  },
  {
    title: "How much the product does",
    body: (
      <>
        <p>
          It makes it easy for the procurement manager to create a Sirion intake request, and it helps them make informed decisions: it shows what was agreed and where each
          value came from.
        </p>
        <ul>
          <li>
            <b>Does on its own:</b> reads the emails you add and fills in the request, each value with its source. Every value can be checked in one click.
          </li>
          <li>
            <b>Suggests, you decide:</b> which email threads belong to the request. It never adds an email from another supplier without warning you, because a wrong
            thread would put a wrong term under your name.
          </li>
          <li>
            <b>Never does on its own:</b> submit the request. That is always your click.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Assumptions",
    body: (
      <ul>
        <li>The company already uses Sirion, with an intake form.</li>
        <li>Staff use Microsoft 365 and IT allows Outlook add-ins. The same add-in can work in Gmail.</li>
        <li>Procurement compares supplier quotes over email before picking one supplier.</li>
        <li>A procurement manager works on several purchases at once, so each email needs to be tied to the right request.</li>
        <li>All data in this prototype is made up.</li>
      </ul>
    ),
  },
  {
    title: "How we would measure it",
    body: (
      <>
        <p>
          <b>North star: clean intake rate.</b> The share of requests submitted with no core field typed by hand that Legal accepts the first time.
        </p>
        <p>
          <b>Guardrails</b> (must not get worse):
        </p>
        <ul>
          <li>Wrong values that reach Legal. The target is zero.</li>
          <li>Time to raise a request. It should go down, never up.</li>
          <li>Legal&apos;s time to start drafting. Faster requests must not slow Legal down.</li>
        </ul>
        <p>
          <b>Counter metrics</b> (to catch the north star looking good for the wrong reason):
        </p>
        <ul>
          <li>How often procurement managers change a value Sirion filled in. If this rises, the AI is getting things wrong.</li>
          <li>Requests sent with fields left empty. A low &quot;typed by hand&quot; count means nothing if fields are simply skipped.</li>
          <li>Requests Legal sends back with questions.</li>
        </ul>
      </>
    ),
  },
];

export function AboutDrawer() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <Drawer title="About this prototype" open={open} onOpenChange={setOpen} width={600}>
      <div className="space-y-6 pb-8" data-tour="about-drawer">
        <p className="text-small text-ink-muted">Sirion intake from Outlook: the thinking behind it, in seven short parts.</p>
        {SECTIONS.map((s, i) => (
          <section key={s.title} className="about-section">
            <h3 className="flex items-center gap-2 text-h3 font-medium text-ink">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs text-white" aria-hidden>
                {i + 1}
              </span>
              {s.title}
            </h3>
            <div className="mt-2 space-y-2 pl-8 text-small leading-6 text-ink [&_b]:font-medium [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4">{s.body}</div>
          </section>
        ))}
      </div>
    </Drawer>
  );
}

/** The tab beside "Watch walkthrough". */
export function AboutButton({ onDark }: { onDark?: boolean }) {
  return (
    <button
      onClick={openAbout}
      data-tour="about"
      className={
        onDark
          ? "inline-flex min-h-9 items-center rounded-button border border-white px-3 text-small text-white hover:opacity-90"
          : "inline-flex min-h-9 items-center rounded-button border border-amethyst px-3 text-small text-amethyst hover:bg-white"
      }
    >
      About this prototype
    </button>
  );
}
