"use client";

import { Button, Drawer } from "@/components/ui";
import { SourceTag } from "./Page";

const JOURNEY = [
  "A business team asks procurement for a purchase by email.",
  "Procurement collects quotes and negotiates, mostly by email, sometimes on calls.",
  "Procurement picks a supplier. Some terms are agreed; others are still open.",
  "Procurement reopens the threads and retypes the deal into the intake form.",
  "Legal receives the request and asks questions back by email.",
];

export function ProblemDetails() {
  return (
    <Drawer trigger={<Button size="sm" variant="secondary">Details</Button>} title="Problem details">
      <h3 className="text-h3 text-ink">Job to be done</h3>
      <p className="mt-1 text-small text-ink">
        Get an agreed supplier deal from my inbox into a Legal-ready Sirion request, right after the supplier is chosen, while the position sits across several threads and quotes, without retyping it and without misstating what was agreed or hiding what is still open.
      </p>
      <h3 className="mt-5 text-h3 text-ink">Today's journey</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-small text-ink">
        {JOURNEY.map((j) => (
          <li key={j}>{j}</li>
        ))}
      </ol>
      <h3 className="mt-5 text-h3 text-ink">What the evidence does not show</h3>
      <ul className="mt-1 space-y-2 text-small text-ink">
        <li>Sirion PM interview: how long it takes, how often terms are lost, or what it costs.</li>
        <li>Outside counsel interview: anything about the internal intake handoff.</li>
        <li>WorldCC 11%: how much of it starts at intake.</li>
        <li>Collaboration gap survey: that this specific handoff fails.</li>
        <li className="flex flex-wrap items-center gap-2">
          The core claim, that raising a request from email is slow and loses terms, is an open hypothesis. <SourceTag type="Open hypothesis" />
        </li>
      </ul>
      <h3 className="mt-5 text-h3 text-ink">Alternatives owners use today</h3>
      <p className="mt-1 text-small text-ink">
        Retype into the Sirion form; ask the requester to fill it; paste the thread into a generic AI tool and copy answers into the form; attach the email to a request with an existing add-in and still retype the terms; send Legal the email chain; do nothing.
      </p>
    </Drawer>
  );
}
