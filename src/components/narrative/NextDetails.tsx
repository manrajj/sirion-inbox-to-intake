"use client";

import { Button, Drawer } from "@/components/ui";

const QUESTIONS = [
  "Which fields does Sirion's standard intake form require for a SaaS order?",
  "Can a draft Sirion request act as the deal ID, and does Sirion have an intake API a production add-in could use?",
  "What exactly does Sirion's Outlook plugin do today, and could the deal sidebar extend it rather than ship as a new add-in?",
  "What share of contract requests are SaaS subscriptions, and how many arrive under an existing MSA?",
  "Is the owners' real burden finding documents or working out what was agreed?",
  "Who would sponsor this inside a Sirion customer: procurement operations or Legal operations?",
];

const RISKS = [
  ["The handoff problem is small or about finding documents", "Stage 2 discovery with explicit pivot criteria"],
  ["A wrong value is treated as agreed", "Evidence bundles, abstention, the three-state boundary, owner confirmation"],
  ["Emails filed to the wrong deal", "Owner click, mismatch warning, removable items, wrong-deal metric"],
  ["Reviewers rubber-stamp", "Planted-error catch rate in the shadow trial"],
  ["Seen as a copy of existing add-ins", "Lead with term-state reasoning across threads; the sidebar is the entry point, not the claim"],
  ["IT blocks an email add-in", "Reads only on click, central deployment, no mailbox search; injection and disclosure tests"],
  ["The demo looks staged", "Mocked and example parts labelled; live checks with planted wrong outputs"],
];

export function NextDetails() {
  return (
    <div className="flex flex-col gap-2">
      <Drawer trigger={<Button variant="secondary">Open questions</Button>} title="Open questions">
        <ul className="space-y-2">
          {QUESTIONS.map((q) => (
            <li key={q} className="rounded-card border border-line p-3 text-small text-ink bg-white shadow-card">{q}</li>
          ))}
        </ul>
      </Drawer>
      <Drawer trigger={<Button variant="secondary">Risks</Button>} title="Risks and mitigations">
        <ul className="space-y-2">
          {RISKS.map(([r, m]) => (
            <li key={r} className="rounded-card border border-line p-3 text-small bg-white shadow-card">
              <div className="text-ink">{r}</div>
              <div className="text-ink-muted">{m}</div>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
