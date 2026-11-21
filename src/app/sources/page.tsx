import { ExternalLink } from "lucide-react";
import { NarrativePage } from "@/components/narrative/Page";

export const metadata = { title: "Sources · Sirion Inbox-to-Intake" };

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

export default function Page() {
  return (
    <NarrativePage eyebrow="Sources" title="Where every claim comes from" lead="Pages opened 17 to 21 Nov 2026. Vendor pages describe claimed capabilities, not tested behaviour.">
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {GROUPS.map((g) => (
          <section key={g.title} className="mb-4 break-inside-avoid rounded-card border border-line p-4">
            <h2 className="text-h3 text-ink">{g.title}</h2>
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
      </div>
      <p className="text-xs text-ink-muted">Design: a candidate-made Sirion Kit inspired by Sirion's public brand. Not official Sirion material. All company names, people and data in the prototype are fictional.</p>
    </NarrativePage>
  );
}
