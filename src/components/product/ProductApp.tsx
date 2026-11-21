"use client";

import { useEffect } from "react";
import { Brain, RotateCcw, CheckCircle2, X, ArrowUpRight } from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { Button, cx } from "@/components/ui";
import { MailClient } from "./MailClient";
import { SirionRequest, LegalView } from "./SirionApp";
import { HowItDecides } from "./Drawers";
import { CoachMark, useCoach } from "./Coach";

const STEPS = ["Open Sirion in Outlook", "Add the deal's emails", "Check the request", "Send it to Legal"];

export function ProductApp() {
  const view = useApp((s) => s.view);
  const coach = useCoach();
  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-[560px] flex-col">
      <div className="flex items-center gap-x-4 border-b border-line bg-white px-4 py-1">
        <p className="min-w-0 flex-1 truncate text-small text-ink">
          <span className="text-ink-muted">Scenario:</span> Manraj (Procurement) agreed a Brightline deal by email. Now he raises it in Sirion.
        </p>
        <ol className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={coach.stage === i ? "step" : undefined}
              className={cx(
                "flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs",
                coach.stage === i ? "bg-tone-success-bg text-teal" : coach.stage > i ? "text-ink" : "text-ink-muted",
              )}
            >
              <span className={cx("inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]", coach.stage > i ? "bg-teal text-white" : "border border-current")} aria-hidden>
                {coach.stage > i ? "✓" : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <div className="flex shrink-0 items-center">
          <HowItDecides
            trigger={
              <Button size="sm" variant="ghost" icon={<Brain size={15} strokeWidth={1.5} aria-hidden />} data-tour="how-it-decides" aria-label="How it decides">
                <span className="hidden 2xl:inline">How it decides</span>
              </Button>
            }
          />
          <Button size="sm" variant="ghost" onClick={() => actions.resetDeal()} icon={<RotateCcw size={15} strokeWidth={1.5} aria-hidden />} aria-label="Start again">
            <span className="hidden 2xl:inline">Start again</span>
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {view === "inbox" && <MailClient />}
        {view === "sirion" && <SirionRequest />}
        {view === "legal" && <LegalView />}
        <Toast />
      </div>
      <CoachMark target={coach.target} label={coach.label} />
    </div>
  );
}

function Toast() {
  const toast = useApp((s) => s.toast);
  const view = useDealView();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => actions.dismissToast(), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 rounded-card bg-stage py-2 pl-4 pr-2 text-small text-ink-on-stage shadow-pop fade-in" data-tour="toast">
        <CheckCircle2 size={18} strokeWidth={1.75} className="shrink-0 text-mint" aria-hidden />
        <span>
          {toast.text}
          <span className="block text-xs text-ink-on-stage opacity-80">
            Request prefilled: {view.core.filter((c) => c.value !== null).length} of 7 fields
          </span>
        </span>
        <button onClick={() => actions.setView("sirion")} className="inline-flex min-h-11 items-center gap-1 rounded-button px-3 text-small text-white underline-offset-4 hover:underline">
          Open in Sirion <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
        <button onClick={() => actions.dismissToast()} className="inline-flex h-11 w-11 items-center justify-center rounded-button text-ink-on-stage hover:bg-ink" aria-label="Dismiss">
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
