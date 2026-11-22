"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X, ArrowUpRight, Play, RotateCcw } from "lucide-react";
import { actions, useApp } from "@/lib/store";
import { useIsMobile } from "@/lib/useIsMobile";
import { MailClient } from "./MailClient";
import { MailMobile } from "./MailMobile";
import { SirionRequest } from "./SirionApp";
// "How it decides" (Drawers.tsx) is kept in code but no longer shown here; the autonomy
// story will come back on the narrative pages.
import { CoachMark, useCoach } from "./Coach";
import { AboutButton } from "./About";
import { PreloadLogos, SirionLogo } from "./SirionMark";
import { startFilm } from "@/components/walkthrough/Film";

export function ProductApp() {
  const view = useApp((s) => s.view);
  const mobile = useIsMobile();
  const coach = useCoach(!!mobile);
  return (
    <div className="flex h-[100dvh] min-h-[520px] flex-col">
      {mobile && <PrototypeBar />}
      <div className="relative min-h-0 flex-1">
        {mobile !== null && view === "inbox" && (mobile ? <MailMobile /> : <MailClient />)}
        {mobile !== null && view === "sirion" && <SirionRequest />}
        <OpeningSirion view={view} />
        <Toast />
      </div>
      <CoachMark target={coach.target} label={coach.label} />
      <PreloadLogos />
    </div>
  );
}

/** On a phone the apps fill the screen, so the prototype's own controls sit in a thin bar above them. */
function PrototypeBar() {
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 bg-stage px-3 text-xs text-ink-on-stage">
      <span className="font-medium">Prototype</span>
      <span className="ml-auto flex items-center gap-1.5">
        <AboutButton onDark compact />
        <button onClick={() => startFilm(0)} className="inline-flex min-h-8 items-center gap-1 rounded-button bg-amethyst px-2.5 text-xs text-white" data-tour="watch">
          <Play size={12} strokeWidth={2} aria-hidden /> Watch
        </button>
        <button onClick={() => actions.resetDeal()} className="inline-flex h-8 w-8 items-center justify-center rounded-button text-ink-on-stage" aria-label="Start again" title="Start again">
          <RotateCcw size={14} strokeWidth={1.75} />
        </button>
      </span>
    </div>
  );
}

/** A short hand-off when Outlook gives way to Sirion, so it is clear another app has opened. */
function OpeningSirion({ view }: { view: string }) {
  const prev = useRef(view);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (prev.current === "inbox" && view === "sirion") {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1800);
      prev.current = view;
      return () => clearTimeout(t);
    }
    prev.current = view;
  }, [view]);
  if (!show) return null;
  return (
    <div className="opening-sirion pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-teal text-white" aria-hidden data-tour="opening-sirion">
      <SirionLogo size={30} inverse />
      <p className="text-small text-white/90">Opening your draft in Sirion</p>
    </div>
  );
}

function Toast() {
  const toast = useApp((s) => s.toast);
  const view = useApp((s) => s.view);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => actions.dismissToast(), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3 md:bottom-4 md:top-auto">
      <div role="status" aria-live="polite" className="pointer-events-auto flex max-w-[640px] items-center gap-3 rounded-card bg-teal py-2 pl-4 pr-2 text-small text-white shadow-pop fade-in" data-tour="toast">
        <CheckCircle2 size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span className="min-w-0">
          {toast.text}
          {toast.sub && <span className="block text-xs text-white/85">{toast.sub}</span>}
        </span>
        {view !== "sirion" && (
          <button onClick={() => actions.setView("sirion")} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-button bg-white px-3 text-small text-teal hover:opacity-90">
            Review <span className="hidden sm:inline">in Sirion</span> <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        )}
        <button onClick={() => actions.dismissToast()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-button text-white" aria-label="Dismiss">
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
