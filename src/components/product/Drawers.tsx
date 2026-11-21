"use client";

import { Check, X } from "lucide-react";
import { SCHEMA_TEXT } from "@/lib/schema";
import { runGuardrails } from "@/lib/guardrail-suite";
import { Drawer, HonestyChip, Tabs } from "@/components/ui";

export const AUTONOMY = [
  {
    level: "Act alone (read-only)",
    actions: "Coverage, term timelines, MSA lookup, conflict flags, domain-mismatch warning",
    checkpoint: "Owner sees and can correct everything",
    audit: "Input, output, model version, time",
  },
  {
    level: "Suggest",
    actions: "Deal match, term status and value, contract type, route, chase drafts",
    checkpoint: "Owner confirms or rejects",
    audit: "Suggestion, reason, confidence, evidence, owner's choice",
  },
  {
    level: "Act with one click",
    actions: "Add to deal, submit, accept route",
    checkpoint: "Owner clicks; submit needs core data and evidence confirmed",
    audit: "Who, message IDs, content hash, before and after values",
  },
  {
    level: "Never",
    actions: "Attach without a click, read mail that wasn't added, mark agreed without evidence, email a supplier, decide the contract type",
    checkpoint: "Not offered",
    audit: "n/a",
  },
];

export const FIVE_CHECKS = [
  "The cited text exists word for word in the added material.",
  "The evidence bundle covers the offer, any condition, its resolution, and acceptance from both sides.",
  "No contradiction is found in the added material.",
  "The value parses to the field type, the sender is on the side it claims, and the entity matches the deal.",
  "The owner confirms, in the UI.",
];

export function HowItDecides({ trigger }: { trigger: React.ReactNode }) {
  const g = runGuardrails();
  return (
    <Drawer trigger={trigger} title="How it decides" width={640}>
      <Tabs
        tabs={[
          {
            id: "ladder",
            label: "Autonomy",
            content: (
              <div className="space-y-3 pt-4">
                <p className="text-small text-ink">The model only extracts and classifies. Code decides what counts as agreed. People decide everything else.</p>
                <ol className="space-y-2">
                  {AUTONOMY.map((a, i) => (
                    <li key={a.level} className="rounded-card border border-line p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-pill bg-surface-alt text-xs text-teal">{i + 1}</span>
                        <span className="text-h3 text-ink">{a.level}</span>
                      </div>
                      <p className="mt-1 text-small text-ink">{a.actions}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Checkpoint: {a.checkpoint}. Audit: {a.audit}.
                      </p>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-ink-muted">Deal suggestion threshold: shown only when the supplier domain or a quote number really matches. Critical fields never move to auto-accept.</p>
              </div>
            ),
          },
          {
            id: "checks",
            label: "Five checks",
            content: (
              <div className="space-y-3 pt-4">
                <p className="text-small text-ink">
                  A term is “accepted by both” only if all five pass. If any fails, the term abstains and shows why. <HonestyChip kind="live" />
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-small text-ink">
                  {FIVE_CHECKS.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
                <h3 className="pt-2 text-h3 text-ink">Deliberately wrong model output, caught by the checks</h3>
                <ul className="space-y-1">
                  {g.results.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 rounded-chip border border-line p-2 text-xs">
                      {r.pass ? <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-teal" aria-label="caught" /> : <X size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-label="missed" />}
                      <span>
                        <span className="text-ink">{r.name}</span>
                        {r.wrongOutput && <span className="ml-1 rounded-pill bg-surface-alt px-2 text-ink-muted">wrong output</span>}
                        <span className="block text-ink-muted">{r.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-muted">
                  {g.passed} of {g.total} cases pass, run live in your browser now. Planted in the data: a paraphrased citation and a one-sided acceptance (DL-1042), a chase draft naming a rival (DL-1076).
                </p>
              </div>
            ),
          },
          {
            id: "schema",
            label: "Model contract",
            content: (
              <div className="space-y-3 pt-4">
                <p className="text-small text-ink">The contract the model must meet. Every example output is validated against it (Zod) at build time.</p>
                <pre className="overflow-x-auto rounded-card bg-surface-alt p-3 font-mono text-xs leading-5 text-ink">{SCHEMA_TEXT}</pre>
                <div className="rounded-card border border-line p-3 text-small text-ink">
                  <div className="mb-1 text-h3">In production</div>
                  The model call runs server-side with structured output against this schema. Supplier text is wrapped as evidence only, never as instructions. These same checks sit after it.
                </div>
                <p className="text-xs text-ink-muted">In this prototype, AI outputs are pre-written examples of what the model returns. The checks run live.</p>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

export const UX_NOTES = [
  "Jakob: the inbox follows Outlook's web layout, with the add-in pane on the right; review uses a reading pane.",
  "Fitts: targets at least 44 px, 8 px apart; Submit sits after the last field; Confirm and Change are never adjacent.",
  "Miller: fields in four groups; IDs and money formatted; nothing to remember across screens.",
  "Hick: one primary action per screen; detail behind Timeline, Checks and Details.",
  "Postel: forgiving value parsing; specific messages next to the field; fluid from 360 to 1440 px.",
  "Peak-end: the peak is the citation lighting up the 4% condition; the end is a clear receipt.",
  "Tesler: the AI prefills; the owner only confirms. Typing counts against the north star.",
  "Doherty: feedback under 400 ms; step text while reading; friction only on Submit.",
  "Von Restorff: one emphasis per view; risky actions in Quartz with a warning icon.",
  "Ethics: no pre-ticked confirmations; nothing attached, submitted or sent without a click.",
];

export function DesignNotes({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Drawer trigger={trigger} title="Design notes" width={520}>
      <ul className="space-y-2 text-small text-ink">
        {UX_NOTES.map((n) => (
          <li key={n} className="border-b border-line pb-2">
            {n}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">Styled with a candidate-made Sirion Kit inspired by Sirion's public brand. Not official Sirion material.</p>
    </Drawer>
  );
}
