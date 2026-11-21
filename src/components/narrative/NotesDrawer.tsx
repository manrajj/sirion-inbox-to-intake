"use client";

import { ExternalLink } from "lucide-react";
import { Drawer, Tabs } from "@/components/ui";

// Assumptions, the learning plan and sources live in one drawer, so the
// reviewer only has the brief's five sections to walk through.

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

const STAGES = [
  { n: 1, title: "Challenge set", when: "Now, before submission", what: "10 to 15 synthetic SaaS deals, labelled by two people. Three-way benchmark: manual, generic AI plus form, Inbox-to-Intake.", decide: "Ship only if the release test passes" },
  { n: 2, title: "Artifact discovery", when: "First step with a real customer", what: "3 to 5 owner walkthroughs of their last deal, timed. Audit 10 to 15 permissioned deals for omitted or wrong terms.", decide: "Continue only if working out what was agreed, not finding documents, is the burden" },
  { n: 3, title: "Supervised shadow trial", when: "Live eligible deals", what: "The sidebar runs beside the manual process; owners do not submit from it. Measure time, fields typed, critical errors, planted-error catch rate.", decide: "Continue only if zero wrong critical values reach a brief and time beats manual" },
  { n: 4, title: "Comparative pilot", when: "After the shadow trial", what: "Alternate deals within each owner between sidebar and manual. Report only matured cohorts.", decide: "Sample sized from observed volume, set before the pilot" },
];

const DEFERRED = ["Real Outlook add-in and Gmail add-on", "Live Sirion integration", "Scanned PDFs (OCR)", "Excel parsing", "Translation", "Multiple currencies", "Position checks against preferred and fallback positions (negotiation stage)"];

type Src = { label: string; href?: string; note?: string };
const GROUPS: { title: string; items: Src[] }[] = [
  {
    title: "Research",
    items: [
      { label: "WorldCC, Closing the procurement value gap", href: "https://info.worldcc.com/closing-the-procurement-value-gap" },
      { label: "WorldCC, CCM Institute and Agiloft, The Procurement-Legal relationship: the collaboration gap", note: "Local copy; shared-tool figures on p. 12" },
      { label: "Sirion and CCM Institute, Most Negotiated Terms 2026", href: "https://www.sirion.ai/fr/library/contract-insights/companies-negotiating-wrong-contract-terms/" },
    ],
  },
  {
    title: "Interviews",
    items: [{ label: "One Sirion product manager" }, { label: "One outside counsel" }],
  },
  {
    title: "Sirion",
    items: [
      { label: "Contract negotiations (version control, audit trail, negotiation history)", href: "https://www.sirion.ai/sirion-university/contracting-use-cases/create/contract-negotiations" },
      { label: "Contract redlining software (Word add-in, previously negotiated clauses)", href: "https://www.sirion.ai/library/clm-platform/contract-redlining-software" },
      { label: "Contract authoring and Outlook plugin", href: "https://www.sirion.ai/platform/create/contract-authoring/" },
      { label: "Centralizing contract requests", href: "https://www.sirion.ai/library/contract-insights/centralize-contract-requests-tools/" },
      { label: "Sirion and Legora partnership", href: "https://legora.com/newsroom/legora-and-sirion-partner-to-bring-agentic-legal-ai-and-enterprise-contract-intelligence-together-in-one-connected-experience" },
    ],
  },
  {
    title: "Sidebar model",
    items: [
      { label: "Harvey, The new Harvey for Outlook (12 Aug 2026)", href: "https://www.harvey.ai/blog/the-new-harvey-for-outlook" },
      { label: "Harvey for Outlook: how to set up and use", href: "https://help.harvey.ai/articles/harvey-for-outlook" },
      { label: "Google, Gmail add-on scopes", href: "https://developers.google.com/gmail/add-ons/concepts/scopes" },
    ],
  },
  {
    title: "Email-to-request add-ins and intake tools",
    items: [
      { label: "ContractPodAi for Outlook", href: "https://appsource.microsoft.com/en/product/office/WA200003959" },
      { label: "ContractPodAi for Gmail", href: "https://workspace.google.com/marketplace/app/contractpodai_for_gmail/415245748887" },
      { label: "Spendflo intake agent", href: "https://www.spendflo.com/agents/ai-contract-request-intake-agent" },
      { label: "Coupa Navi request agent", href: "https://ai.coupa.com/use-case/coupa-navi-request-creation-agent/" },
      { label: "Summize for Outlook", href: "https://summize.com/integrations/outlook" },
    ],
  },
  {
    title: "SaaS spend benchmarks",
    items: [
      { label: "Vertice, SaaS spend per employee", href: "https://www.vertice.one/insights/saas-spend-per-employee" },
      { label: "Zylo, 2026 SaaS Management Index", href: "https://zylo.com/news/2026-saas-management-index" },
    ],
  },
];

export function NotesDrawer({ trigger }: { trigger: React.ReactNode }) {
  const assumptions = (
    <ul className="space-y-2 pt-4">
      {ASSUMPTIONS.map((a, i) => (
        <li key={a.text} className="rounded-card border border-line bg-white p-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{a.area}</span>
            <span>A{i + 1}</span>
          </div>
          <p className="mt-1 text-small text-ink">{a.text}</p>
          <p className="mt-1 text-xs text-ink-muted">How we would check: {a.test}</p>
        </li>
      ))}
      <li className="rounded-chip bg-surface-alt p-3 text-small text-ink">The biggest risk is that the problem is smaller than assumed. The learning plan tests that first.</li>
    </ul>
  );
  const plan = (
    <div className="pt-4">
      <ol className="space-y-2">
        {STAGES.map((s) => (
          <li key={s.n} className="rounded-card border border-line bg-white p-3">
            <div className="text-xs text-ink-muted">
              Stage {s.n} · {s.when}
            </div>
            <h3 className="text-h3 text-ink">{s.title}</h3>
            <p className="mt-1 text-small text-ink-muted">{s.what}</p>
            <p className="mt-1 text-small text-teal">{s.decide}</p>
          </li>
        ))}
      </ol>
      <h3 className="mt-4 text-h3 text-ink">Left out of v1, on purpose</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {DEFERRED.map((d) => (
          <li key={d} className="rounded-pill border border-line px-3 py-1 text-xs text-ink">
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
  const sources = (
    <div className="space-y-4 pt-4">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="text-h3 text-ink">{g.title}</h3>
          <ul className="mt-1">
            {g.items.map((i) => (
              <li key={i.label} className="py-1 text-small">
                {i.href ? (
                  <a href={i.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-teal underline-offset-2 hover:underline">
                    {i.label} <ExternalLink size={12} strokeWidth={1.5} className="mt-1 shrink-0" aria-label="opens in a new tab" />
                  </a>
                ) : (
                  <span className="text-ink">{i.label}</span>
                )}
                {i.note && <span className="block text-xs text-ink-muted">{i.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-ink-muted">Pages opened 17 to 21 Nov 2026. Vendor pages describe claimed capabilities, not tested behaviour. All company names, people and data in the prototype are fictional.</p>
    </div>
  );
  return (
    <Drawer trigger={trigger} title="Assumptions, plan and sources" width={600}>
      <Tabs
        tabs={[
          { id: "assumptions", label: "Assumptions", content: assumptions },
          { id: "plan", label: "Learning plan", content: plan },
          { id: "sources", label: "Sources", content: sources },
        ]}
      />
    </Drawer>
  );
}
