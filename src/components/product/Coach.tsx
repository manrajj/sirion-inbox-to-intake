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

export function useCoach(mobile = false): Coach {
  const s = useApp((x) => x);
  const view = useDealView();
  const ds = s.deals[s.dealId];
  const deal = getDeal(s.dealId);
  const mainAdded = view.addedIds.has(deal.openMessageId);
  const submitted = !!ds.submit.requestId;
  const conflict = view.terms.find((t) => t.needsDecision);

  const picked = !!ds.pickedDealId;
  if (submitted) return { stage: 4, target: "about", label: "Done. Now see the thinking behind it" };
  if (s.view === "sirion") {
    if (view.core.some((c) => c.value === null))
      return { stage: 2, target: "submit-fix", label: mainAdded ? "Some fields are empty. Fill them in." : "Add the Brightline emails first" };
    if (conflict) return { stage: 2, target: `options-${conflict.key}`, label: "The email and the quote disagree. Pick one." };
    return { stage: 3, target: "submit", label: "All filled in. Check the values, edit any with the pencil, then submit." };
  }
  if (s.view === "inbox") {
    if (mobile && !s.sidebarOpen && (s.mailScreen ?? "list") === "list") return { stage: 0, target: "thread-t-bl", label: picked ? "Open the Brightline email" : "Start here: open the Brightline email" };
    if (!s.sidebarOpen) return { stage: picked ? 2 : 0, target: "open-sidebar", label: picked ? "Open Sirion again" : mobile ? "Tap Sirion to open the add-in" : "Start here: open the Sirion add-in" };
    if (ds.pendingWarning) return { stage: 1, target: "mismatch-cancel", label: "Wrong supplier. Don't add it." };
    if (ds.reading) return { stage: 1, target: null, label: "" };
    if (!picked) return { stage: 1, target: "create-deal", label: "Start the intake request here" };
    if (!mainAdded) {
      if (s.openMessageId && deal.messages.find((m) => m.id === s.openMessageId)?.threadId !== deal.messages.find((m) => m.id === deal.openMessageId)?.threadId)
        return { stage: 1, target: "thread-t-bl", label: "Open the Brightline email" };
      return { stage: 1, target: "add-to-sirion", label: "Add this email thread to the request" };
    }
    if (s.panel !== "home") return { stage: 2, target: "answer-review", label: "Now review and submit it in Sirion" };
    return { stage: 2, target: "review-in-sirion", label: "Now review and submit it in Sirion" };
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
      // Wait while the "Opening your draft in Sirion" hand-off covers the screen
      if (document.querySelector('[data-tour="opening-sirion"]')) {
        setRect(null);
        raf = requestAnimationFrame(loop);
        return;
      }
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
  const W = 240;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Place the label beside the target where there is room, so it never hides the content around it.
  let pos: React.CSSProperties;
  const midY = Math.max(8, Math.min(vh - 60, rect.top + rect.height / 2 - 22));
  const cx0 = Math.max(8, Math.min(vw - W - 8, rect.left + rect.width / 2 - W / 2));
  if (rect.bottom + 84 < vh) pos = { left: cx0, top: rect.bottom + 12, justifyContent: "center" };
  else if (rect.top - 84 > 0) pos = { left: cx0, bottom: vh - rect.top + 12, justifyContent: "center" };
  else if (rect.right + 16 + W < vw) pos = { left: rect.right + 16, top: midY, justifyContent: "flex-start" };
  else pos = { left: Math.max(8, rect.left - 16 - W), top: midY, justifyContent: "flex-end" };
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40" data-coach={target}>
      <div
        className="coach-ring absolute rounded-[12px]"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
      />
      <div
        className="absolute flex"
        style={{ ...pos, width: W }}
      >
        <span className="coach-label rounded-button bg-amethyst px-3 py-1.5 text-center text-small text-white shadow-pop">{label}</span>
      </div>
    </div>
  );
}
