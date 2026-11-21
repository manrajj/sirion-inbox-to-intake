"use client";

import { useEffect, useState } from "react";
import { useApp, useDealView } from "@/lib/store";
import { getDeal } from "@data/index";

// Points at the one next thing to click, so a first-time reviewer never has to
// hunt. It follows the real state, and steps aside while the film plays.

export interface Coach {
  /** 0..3 for the four scenario steps, 4 when done. */
  stage: number;
  target: string | null;
  label: string;
}

export function useCoach(): Coach {
  const s = useApp((x) => x);
  const view = useDealView();
  const ds = s.deals[s.dealId];
  const deal = getDeal(s.dealId);
  const mainAdded = view.addedIds.has(deal.openMessageId);
  const submitted = !!ds.submit.requestId;
  const conflict = view.terms.find((t) => t.needsDecision);

  if (submitted) {
    if (s.view === "legal") return { stage: 4, target: ds.legalDecision ? null : "start-drafting", label: "Legal decides if it can start" };
    return { stage: 4, target: s.view === "sirion" ? "open-legal" : null, label: "See what Legal receives" };
  }
  if (s.view === "sirion") {
    if (conflict) return { stage: 2, target: `options-${conflict.key}`, label: "The email and the quote disagree. Pick one." };
    if (ds.submit.status !== "idle") return { stage: 3, target: null, label: "" };
    return { stage: 3, target: "submit", label: "Everything is prefilled. Submit it." };
  }
  if (s.view === "inbox") {
    if (!s.sidebarOpen) return { stage: mainAdded ? 2 : 0, target: "open-sidebar", label: mainAdded ? "Open Sirion again" : "Start here: open the Sirion add-in" };
    if (ds.pendingWarning) return { stage: 1, target: "mismatch-cancel", label: "Wrong supplier. Don't add it." };
    if (ds.reading) return { stage: 1, target: null, label: "" };
    if (!mainAdded) {
      if (s.openMessageId && deal.messages.find((m) => m.id === s.openMessageId)?.threadId !== deal.messages.find((m) => m.id === deal.openMessageId)?.threadId)
        return { stage: 1, target: "thread-t-bl", label: "Open the Brightline email" };
      return { stage: 1, target: "add-to-sirion", label: "Add this email thread to the deal" };
    }
    if (s.panel !== "home") return { stage: 2, target: null, label: "" };
    return { stage: 2, target: "review-in-sirion", label: "See the request Sirion built" };
  }
  return { stage: 0, target: null, label: "" };
}

export function CoachMark({ target, label }: { target: string | null; label: string }) {
  const film = useApp((s) => s.film);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target || film) {
      setRect(null);
      return;
    }
    let raf = 0;
    let scrolled = false;
    const loop = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
      const el = els.find((e) => e.getClientRects().length > 0 && e.offsetParent !== null);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      const r = el?.getBoundingClientRect() ?? null;
      setRect((p) => (r && p && p.x === r.x && p.y === r.y && p.width === r.width && p.height === r.height ? p : r && r.width > 0 ? r : null));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, film]);

  if (!rect || !target || film) return null;
  const pad = 4;
  const below = rect.bottom + 56 < window.innerHeight;
  const labelLeft = Math.max(8, Math.min(window.innerWidth - 268, rect.left + rect.width / 2 - 130));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40" data-coach={target}>
      <div
        className="coach-ring absolute rounded-[12px]"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
      />
      <div
        className="absolute flex w-[260px] justify-center"
        style={{ left: labelLeft, top: below ? rect.bottom + 12 : undefined, bottom: below ? undefined : window.innerHeight - rect.top + 12 }}
      >
        <span className="coach-label rounded-button bg-amethyst px-3 py-1.5 text-center text-small text-white shadow-pop">{label}</span>
      </div>
    </div>
  );
}
