"use client";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Brain, Palette, RotateCcw, Check, MonitorSmartphone } from "lucide-react";
import { useState } from "react";
import { actions, useApp, type View } from "@/lib/store";
import { DEALS } from "@data/index";
import { Button, cx } from "@/components/ui";
import { MailClient } from "./MailClient";
import { Review } from "./Review";
import { Receipt, LegalView } from "./Handoff";
import { ContractRecord } from "./ContractRecord";
import { HowItDecides, DesignNotes, ChaseModal } from "./Drawers";

const STEPS: { id: View; label: string }[] = [
  { id: "inbox", label: "Owner's inbox" },
  { id: "review", label: "Review" },
  { id: "receipt", label: "Receipt" },
  { id: "legal", label: "Legal" },
  { id: "record", label: "Contract record" },
];

export function ProductApp() {
  const view = useApp((s) => s.view);
  const dealId = useApp((s) => s.dealId);
  const ds = useApp((s) => s.deals[s.dealId]);
  const submitted = !!ds.submit.requestId;
  const enabled = (v: View) =>
    v === "inbox" || (v === "review" && ds.added.some((a) => !a.removed)) || (submitted && (v === "receipt" || v === "legal")) || (v === "record" && dealId === "DL-1042" && submitted);

  return (
    <div className="flex h-[100dvh] min-h-[560px] flex-col pb-[60px] lg:pb-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2">
        <DealSwitcher />
        <nav aria-label="Flow" className="hidden items-center gap-2 md:flex" data-tour="flow-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              disabled={!enabled(s.id)}
              onClick={() => actions.setView(s.id)}
              aria-current={view === s.id ? "step" : undefined}
              className={cx(
                "min-h-9 rounded-pill px-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40",
                view === s.id ? "bg-surface-alt text-teal" : "text-ink-muted hover:text-ink",
              )}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HowItDecides
            trigger={
              <Button size="sm" variant="ghost" icon={<Brain size={15} strokeWidth={1.5} aria-hidden />} data-tour="how-it-decides">
                How it decides
              </Button>
            }
          />
          <DesignNotes
            trigger={
              <Button size="sm" variant="ghost" icon={<Palette size={15} strokeWidth={1.5} aria-hidden />} className="hidden 2xl:inline-flex">
                Design notes
              </Button>
            }
          />
          <Button size="sm" variant="ghost" onClick={() => actions.resetDeal()} icon={<RotateCcw size={15} strokeWidth={1.5} aria-hidden />} aria-label="Reset this deal">
            <span className="hidden 2xl:inline">Reset deal</span>
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-2 border-b border-line bg-surface-alt px-4 py-1.5 text-xs text-ink-muted md:hidden">
        <MonitorSmartphone size={14} strokeWidth={1.5} aria-hidden /> Best on desktop. On a phone, the sidebar replaces the reading pane.
      </p>
      <div className="min-h-0 flex-1">
        {view === "inbox" && <MailClient />}
        {view === "review" && <Review />}
        {view === "receipt" && <Receipt />}
        {view === "legal" && <LegalView />}
        {view === "record" && <ContractRecord />}
      </div>
      <ChaseModal />
    </div>
  );
}

function DealSwitcher() {
  const dealId = useApp((s) => s.dealId);
  const [open, setOpen] = useState(false);
  const current = DEALS.find((d) => d.id === dealId)!;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-button border border-line px-3 text-left hover:bg-surface-alt" data-tour="deal-switcher" aria-label="Switch demo deal">
          <span className="text-xs text-ink-muted">{current.explorationIndex ? `Explore ${current.explorationIndex}` : "Main deal"}</span>
          <span className="max-w-[200px] truncate text-small text-ink">{current.demonstrates}</span>
          <ChevronDown size={15} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-[420px] max-w-[calc(100vw-16px)] rounded-card border border-line bg-white p-2 fade-in">
          <ul>
            {DEALS.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => {
                    actions.loadDeal(d.id);
                    actions.toggleSidebar(true);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-chip px-3 py-1.5 text-left hover:bg-surface-alt"
                  data-tour={`switch-${d.id}`}
                >
                  <span className="w-16 shrink-0 text-xs text-ink-muted">{d.explorationIndex ? `Explore ${d.explorationIndex}` : "Main"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small text-ink">{d.demonstrates}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {d.id} · {d.category} · {d.supplier.name}
                    </span>
                  </span>
                  {d.id === dealId && <Check size={15} strokeWidth={1.5} className="text-teal" aria-label="Current" />}
                </button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
