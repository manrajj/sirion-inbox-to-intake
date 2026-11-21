"use client";

import { useState } from "react";
import { Button, Drawer, cx } from "@/components/ui";

type NodeId = "owner" | "requester" | "legal" | "finance" | "it" | "supplier";

const NODES: Record<NodeId, { label: string; sub: string; x: number; y: number; role: string; wants: string; fears: string; primary?: boolean }> = {
  owner: { label: "Procurement owner", sub: "Primary user", x: 120, y: 220, role: "Adds emails, reviews and submits", wants: "To raise the request in minutes, from the inbox, without retyping", fears: "A wrong term under their name; one more tool", primary: true },
  requester: { label: "Business requester", sub: "User, supplies the deal", x: 200, y: 60, role: "Holds some threads and quotes; often negotiates SaaS deals", wants: "A fast start; not answering the same questions twice", fears: "Repeated questions and delays" },
  supplier: { label: "Supplier", sub: "Affected party", x: 520, y: 60, role: "Signs the contract", wants: "Quick signature, no new portal", fears: "Rival quotes or internal limits exposed" },
  legal: { label: "Legal intake", sub: "Secondary user", x: 600, y: 220, role: "Receives the request and drafts", wants: "The full position, open items marked honestly", fears: "Guesses handed over as facts" },
  finance: { label: "Finance and AP", sub: "Secondary user", x: 520, y: 380, role: "Checks invoices against terms", wants: "Terms they can check invoices against", fears: "Paying against email terms" },
  it: { label: "IT and security", sub: "Gatekeeper", x: 200, y: 380, role: "Deploys and restricts the add-in", wants: "Scoped access, central deployment, no data leaks", fears: "An add-in reading the whole mailbox" },
};

const CONFLICTS: { id: string; a: NodeId; b: NodeId; title: string; short: string; t: number; tradeoff: string; resolution: string }[] = [
  {
    id: "speed",
    short: "Speed vs completeness",
    t: 0.62,
    a: "requester",
    b: "legal",
    title: "Speed vs completeness",
    tradeoff: "Owner and requester want to start fast. Legal wants the full position before drafting.",
    resolution: "Adding the emails to the deal ID is the fast path, and the same emails are the evidence. Core data is required; open terms go to Legal marked and owned, never shown as agreed.",
  },
  {
    id: "control",
    short: "Control vs autonomy",
    t: 0.5,
    a: "owner",
    b: "legal",
    title: "Legal control vs Procurement autonomy",
    tradeoff: "Legal wants to own routing and the bar for “ready”. Procurement wants to move without waiting.",
    resolution: "Legal owns the routing rules and the Legal-ready checklist. Procurement sees which rule fired on every request.",
  },
  {
    id: "savings",
    short: "Savings vs enforceability",
    t: 0.58,
    a: "owner",
    b: "finance",
    title: "Booked savings vs enforceability",
    tradeoff: "Procurement wants savings booked from the email deal. Finance needs terms it can enforce.",
    resolution: "Finance gets the evidenced rate card and terms as a reference pack. The signed contract governs payment.",
  },
  {
    id: "security",
    short: "Email access vs security",
    t: 0.5,
    a: "owner",
    b: "it",
    title: "Reading email vs data exposure",
    tradeoff: "The product needs to read deal email. IT fears an add-in reading the whole mailbox.",
    resolution: "The sidebar reads only what the owner adds, at the moment they click. No background reading, no inbox search, central deployment. Supplier text is evidence, never an instruction.",
  },
  {
    id: "confidential",
    short: "Convenience vs confidentiality",
    t: 0.38,
    a: "owner",
    b: "supplier",
    title: "Convenience vs confidentiality",
    tradeoff: "A chase email is easier with all the context. The supplier must never see rival quotes or internal limits.",
    resolution: "Chase drafts use only that supplier's own thread. Rival quotes never reach a supplier. Nothing is sent from Sirion.",
  },
];

type Sel = { kind: "node"; id: NodeId } | { kind: "conflict"; id: string };

export function StakeholderMap() {
  const [sel, setSel] = useState<Sel>({ kind: "conflict", id: "speed" });
  const node = sel.kind === "node" ? NODES[sel.id] : null;
  const conflict = sel.kind === "conflict" ? CONFLICTS.find((c) => c.id === sel.id)! : null;
  const related = sel.kind === "node" ? CONFLICTS.filter((c) => c.a === sel.id || c.b === sel.id) : [];

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 md:hidden" aria-label="Stakeholders and conflicts">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NODES) as NodeId[]).map((id) => (
            <button key={id} onClick={() => setSel({ kind: "node", id })} aria-pressed={sel.kind === "node" && sel.id === id} className={cx("min-h-11 rounded-pill border px-3 text-small", sel.kind === "node" && sel.id === id ? "border-teal bg-teal text-white" : "border-line bg-white text-ink")}>
              {NODES[id].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CONFLICTS.map((c) => (
            <button key={c.id} onClick={() => setSel({ kind: "conflict", id: c.id })} aria-pressed={sel.kind === "conflict" && sel.id === c.id} className={cx("min-h-11 rounded-pill border border-dashed px-3 text-small", sel.kind === "conflict" && sel.id === c.id ? "border-teal bg-teal text-white" : "border-quartz bg-white text-ink")}>
              {c.short}
            </button>
          ))}
        </div>
      </div>
      <div className="glow-light relative hidden rounded-card border border-line md:block">
        <svg viewBox="0 0 720 440" className="h-full max-h-[540px] w-full" role="group" aria-label="Stakeholder map. Select a person or a conflict line.">
          {/* conflict lines */}
          {CONFLICTS.map((c) => {
            const A = NODES[c.a];
            const B = NODES[c.b];
            const active = sel.kind === "conflict" && sel.id === c.id;
            const mx = A.x + (B.x - A.x) * c.t;
            const my = A.y + (B.y - A.y) * c.t;
            return (
              <g key={c.id}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={active ? "var(--brand-primary)" : "var(--quartz)"} strokeWidth={active ? 3 : 2} strokeDasharray={active ? undefined : "6 5"} />
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="transparent"
                  strokeWidth={22}
                  className="cursor-pointer"
                  onClick={() => setSel({ kind: "conflict", id: c.id })}
                />
                <foreignObject x={mx - 100} y={my - 15} width={200} height={30}>
                  <button
                    onClick={() => setSel({ kind: "conflict", id: c.id })}
                    className={cx(
                      "mx-auto block max-w-full truncate rounded-pill border px-2 text-xs leading-7",
                      active ? "border-teal bg-teal text-white" : "border-quartz bg-white text-ink hover:bg-surface-alt",
                    )}
                    aria-pressed={active}
                    data-tour={`conflict-${c.id}`}
                  >
                    {c.short}
                  </button>
                </foreignObject>
              </g>
            );
          })}
          {/* nodes */}
          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const active = sel.kind === "node" && sel.id === id;
            return (
              <foreignObject key={id} x={n.x - 78} y={n.y - 30} width={156} height={60}>
                <button
                  onClick={() => setSel({ kind: "node", id })}
                  aria-pressed={active}
                  className={cx(
                    "flex h-[60px] w-full flex-col items-center justify-center rounded-card border px-2 text-center",
                    active ? "border-teal bg-teal text-white" : n.primary ? "border-teal bg-white text-ink" : "border-line bg-white text-ink hover:bg-surface-alt",
                  )}
                  data-tour={`node-${id}`}
                >
                  <span className="text-small leading-5">{n.label}</span>
                  <span className={cx("text-xs", active ? "text-white" : "text-ink-muted")}>{n.sub}</span>
                </button>
              </foreignObject>
            );
          })}
        </svg>
        <p className="absolute bottom-2 left-3 text-xs text-ink-muted">Dashed lines are conflicts. Select a person or a line.</p>
      </div>

      <aside className="flex flex-col rounded-card bg-surface-alt p-5" aria-live="polite" aria-label="Details">
        {node && (
          <div className="fade-in" key={node.label}>
            <div className="text-xs text-ink-muted">{node.sub}</div>
            <h2 className="text-h2 text-ink">{node.label}</h2>
            <p className="mt-1 text-small text-ink-muted">{node.role}</p>
            <dl className="mt-4 space-y-3 text-small">
              <div>
                <dt className="text-xs text-ink-muted">Wants</dt>
                <dd className="text-ink">{node.wants}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Fears</dt>
                <dd className="text-ink">{node.fears}</dd>
              </div>
              {related.length > 0 && (
                <div>
                  <dt className="text-xs text-ink-muted">Conflicts</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {related.map((c) => (
                      <button key={c.id} className="rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink hover:text-teal" onClick={() => setSel({ kind: "conflict", id: c.id })}>
                        {c.title}
                      </button>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
        {conflict && (
          <div className="fade-in" key={conflict.id}>
            <div className="text-xs text-ink-muted">
              {NODES[conflict.a].label} and {NODES[conflict.b].label}
            </div>
            <h2 className="text-h2 text-ink">{conflict.title}</h2>
            <dl className="mt-4 space-y-3 text-small">
              <div>
                <dt className="text-xs text-ink-muted">The trade-off</dt>
                <dd className="text-ink">{conflict.tradeoff}</dd>
              </div>
              <div className="rounded-chip border-l-2 border-teal bg-white p-3">
                <dt className="text-xs text-teal">How the product resolves it</dt>
                <dd className="mt-1 text-ink">{conflict.resolution}</dd>
              </div>
            </dl>
          </div>
        )}
        <div className="mt-auto pt-4">
          <RolesDrawer />
        </div>
      </aside>
    </div>
  );
}

const ROLES = [
  ["Primary user", "Procurement contract owner", "Raise a request from the inbox without retyping", "A wrong term under their name"],
  ["Operational sponsor", "Head of procurement or procurement operations", "Clean, fast intake; owners actually using Sirion", "Another tool owners ignore"],
  ["Budget owner", "Sirion's buyer (often Legal or the CPO); packaged in the Sirion licence", "More value from Sirion; more requests through it", "Paying for a feature that adds risk"],
  ["Secondary user", "Legal intake reviewer", "Context early, open items marked honestly", "Being handed guesses as facts"],
  ["Secondary user", "Finance and AP", "A reference pack to check invoices against later", "Paying against email terms"],
  ["Gatekeeper", "IT and security", "Scoped, centrally deployed add-in; no data leaks", "An add-in reading the whole mailbox"],
];

function RolesDrawer() {
  return (
    <Drawer trigger={<Button size="sm" variant="secondary" className="w-full">User vs sponsor vs budget owner</Button>} title="User, sponsor and buyer are different people">
      <p className="mb-3 text-small text-ink">Designed for the procurement owner first. It must earn Legal's and IT's trust to be deployed.</p>
      <ul className="space-y-2">
        {ROLES.map(([role, who, wants, fears]) => (
          <li key={role + who} className="rounded-card border border-line p-3">
            <div className="text-xs text-ink-muted">{role}</div>
            <div className="text-small text-ink">{who}</div>
            <div className="mt-1 text-xs text-ink">Wants: {wants}</div>
            <div className="text-xs text-ink-muted">Fears: {fears}</div>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
