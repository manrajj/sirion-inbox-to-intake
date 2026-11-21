"use client";

import { useEffect } from "react";
import { CheckCircle2, X, ArrowUpRight } from "lucide-react";
import { actions, useApp, useDealView } from "@/lib/store";
import { MailClient } from "./MailClient";
import { SirionRequest } from "./SirionApp";
// "How it decides" (Drawers.tsx) is kept in code but no longer shown here; the autonomy
// story will come back on the narrative pages.
import { CoachMark, useCoach } from "./Coach";
import { AboutDrawer } from "./About";
import { PreloadLogos } from "./SirionMark";

export function ProductApp() {
  const view = useApp((s) => s.view);
  const coach = useCoach();
  return (
    <div className="flex h-[100dvh] min-h-[560px] flex-col">
      <div className="relative min-h-0 flex-1">
        {view === "inbox" && <MailClient />}
        {view === "sirion" && <SirionRequest />}
        <Toast />
      </div>
      <CoachMark target={coach.target} label={coach.label} />
      <AboutDrawer />
      <PreloadLogos />
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
      <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 rounded-card bg-teal py-2 pl-4 pr-2 text-small text-white shadow-pop fade-in" data-tour="toast">
        <CheckCircle2 size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span>
          {toast.text}
          <span className="block text-xs">
            {view.core.filter((c) => c.value !== null).length} of 7 request fields filled in
          </span>
        </span>
        <button onClick={() => actions.setView("sirion")} className="inline-flex min-h-9 items-center gap-1 rounded-button bg-white px-3 text-small text-teal hover:opacity-90">
          Review in Sirion <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
        <button onClick={() => actions.dismissToast()} className="inline-flex h-11 w-11 items-center justify-center rounded-button text-white" aria-label="Dismiss">
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
