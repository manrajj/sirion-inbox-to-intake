"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Hand, X, BarChart3, MousePointerClick } from "lucide-react";
import { actions } from "@/lib/store";
import { CHAPTERS, TOTAL_MS, chapterMs, chapterStart, seekState } from "./walkthrough";
import { cx } from "@/components/ui";

let opener: ((chapter: number) => void) | null = null;
/** Open the film at a chapter. Callable from anywhere (Start here, product). */
export function startFilm(chapter = 0) {
  opener?.(chapter);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const f = () => setReduced(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return reduced;
}

const sel = (t: string) => `[data-tour="${t}"]`;

function findVisible(target: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(sel(target)));
  return els.find((e) => e.getClientRects().length > 0 && e.offsetParent !== null) ?? els[0] ?? null;
}

async function waitFor(target: string, timeout = 1500): Promise<HTMLElement | null> {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const el = findVisible(target);
    if (el && el.getClientRects().length) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

export function Film() {
  const router = useRouter();
  const path = usePathname();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cursor, setCursor] = useState({ x: -60, y: -60, down: false });
  const [elapsed, setElapsed] = useState(0);

  // Fetch the product and metrics routes up front, so the film keeps working if the network drops.
  useEffect(() => {
    router.prefetch("/product/");
    router.prefetch("/metrics/");
  }, [router]);

  const runId = useRef(0);
  const pos = useRef({ chapter: 0, step: 0, actionDone: false, stepStart: 0, stepMs: 0, base: 0 });
  const targetEl = useRef<HTMLElement | null>(null);
  const speedRef = useRef(1);
  speedRef.current = speed;
  const pathRef = useRef(path);
  pathRef.current = path;

  // Keep the spotlight glued to its element while things scroll and re-render.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const loop = () => {
      const el = targetEl.current;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) setRect((p) => (p && p.x === r.x && p.y === r.y && p.w === r.width && p.h === r.height ? p : { x: r.x, y: r.y, w: r.width, h: r.height }));
      }
      const p = pos.current;
      if (p.stepStart) setElapsed(p.base + Math.min(p.stepMs, (performance.now() - p.stepStart) * speedRef.current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const sleep = (ms: number, id: number) =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(runId.current === id), ms / speedRef.current);
    });

  const run = useCallback(
    async (fromChapter: number, fromStep: number, skipAction: boolean) => {
      const id = ++runId.current;
      setPlaying(true);
      setEnded(false);
      for (let c = fromChapter; c < CHAPTERS.length; c++) {
        setChapter(c);
        const steps = CHAPTERS[c].steps;
        for (let s = c === fromChapter ? fromStep : 0; s < steps.length; s++) {
          if (runId.current !== id) return;
          const step = steps[s];
          const skip = c === fromChapter && s === fromStep && skipAction;
          pos.current = { chapter: c, step: s, actionDone: skip, stepStart: performance.now(), stepMs: step.ms, base: chapterStart(c) + steps.slice(0, s).reduce((a, x) => a + x.ms, 0) };

          let el = step.target ? findVisible(step.target) : null;
          // If the target only exists after the action (a new screen), act first.
          if (step.target && !el && step.do && !skip) {
            await step.do();
            pos.current.actionDone = true;
            el = await waitFor(step.target);
          } else if (step.target && !el) {
            el = await waitFor(step.target);
          }
          if (runId.current !== id) return;
          if (el) {
            el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
            targetEl.current = el;
            const r = el.getBoundingClientRect();
            setRect({ x: r.x, y: r.y, w: r.width, h: r.height });
            setCursor({ x: r.x + Math.min(r.width / 2, 80), y: r.y + Math.min(r.height / 2, 22), down: false });
          } else {
            targetEl.current = null;
            setRect(null);
          }
          if (!(await sleep(reduced ? 80 : 650, id))) return;
          if (!pos.current.actionDone) {
            if (step.click && el) {
              setCursor((cur) => ({ ...cur, down: true }));
              el.click();
            }
            if (step.do) await step.do();
            pos.current.actionDone = true;
            setTimeout(() => setCursor((cur) => ({ ...cur, down: false })), 180);
          }
          if (!(await sleep(Math.max(300, step.ms - 650), id))) return;
        }
      }
      if (runId.current === id) {
        setPlaying(false);
        setEnded(true);
        targetEl.current = null;
        setRect(null);
        pos.current.stepStart = 0;
        setElapsed(TOTAL_MS);
      }
    },
    [reduced],
  );

  const ensureProduct = useCallback(async () => {
    if (!pathRef.current?.startsWith("/product")) {
      router.push("/product/");
      await waitFor("inbox", 5000);
    }
  }, [router]);

  const seek = useCallback(
    async (c: number) => {
      runId.current++;
      setPlaying(false);
      setEnded(false);
      setChapter(c);
      await ensureProduct();
      await seekState(c);
      await new Promise((r) => setTimeout(r, 60));
      run(c, 0, false);
    },
    [ensureProduct, run],
  );

  const pause = useCallback(() => {
    runId.current++;
    setPlaying(false);
    pos.current.stepStart = 0;
  }, []);

  const resume = useCallback(() => {
    run(pos.current.chapter, pos.current.step, pos.current.actionDone);
  }, [run]);

  const takeOver = useCallback(() => {
    runId.current++;
    setPlaying(false);
    setOpen(false);
    setEnded(false);
    targetEl.current = null;
    actions.setFilm(false);
  }, []);

  useEffect(() => {
    opener = (c: number) => {
      setOpen(true);
      seek(c);
    };
    return () => {
      opener = null;
    };
  }, [seek]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (ended) seek(0);
        else if (playing) pause();
        else resume();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(CHAPTERS.length - 1, pos.current.chapter + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, pos.current.chapter - 1));
      } else if (e.key === "Escape") {
        takeOver();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, playing, ended, pause, resume, seek, takeOver]);

  if (!open) return null;

  const ch = CHAPTERS[chapter];
  const travel = reduced ? 0 : 600 / speed;
  const pad = 6;

  return (
    <div className="on-stage" data-film="open" role="dialog" aria-label="Guided walkthrough" aria-modal="false">
      {/* Click shield: the film drives the UI; Take over hands it back. */}
      <div className="fixed inset-0 z-[60]" onClick={() => (playing ? pause() : undefined)} aria-hidden />

      {/* Spotlight */}
      {rect && !ended && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[61] rounded-card"
          style={{
            left: rect.x - pad,
            top: rect.y - pad,
            width: rect.w + pad * 2,
            height: rect.h + pad * 2,
            boxShadow: "0 0 0 2px var(--brand-primary), var(--glow-teal), 0 0 0 9999px rgb(11 24 33 / 0.6)",
            transition: reduced ? "none" : "all 0.35s ease",
          }}
        />
      )}
      {!rect && !ended && <div aria-hidden className="pointer-events-none fixed inset-0 z-[61]" style={{ background: "rgb(11 24 33 / 0.6)" }} />}

      {/* Cursor */}
      {!ended && !reduced && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[62]"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${cursor.down ? 0.85 : 1})`, transition: `transform ${travel}ms ease-in-out` }}
        >
          <svg width="22" height="26" viewBox="0 0 22 26">
            <path d="M2 2 L2 21 L7.5 16 L11 24 L14.5 22.5 L11 14.8 L18.5 14.8 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Top: chapters and scrubber */}
      <div className="fixed inset-x-0 top-0 z-[70] px-3 pt-2" style={{ background: "rgb(11 24 33 / 0.92)" }}>
        <div className="mx-auto flex max-w-[1200px] items-center gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={i === chapter}
              onClick={() => seek(i)}
              className={cx(
                "min-h-9 shrink-0 rounded-pill px-2.5 text-xs",
                i === chapter ? "bg-teal text-white" : i < chapter ? "text-ink-on-stage" : "text-ink-on-stage opacity-70 hover:opacity-100",
              )}
              title={c.caption}
            >
              <span className="text-lilac">{String(i + 1).padStart(2, "0")}</span> {c.title}
            </button>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1200px] pb-2" aria-label="Progress">
          {CHAPTERS.map((c, i) => {
            const start = chapterStart(i);
            const len = chapterMs(i);
            const fill = Math.max(0, Math.min(1, (elapsed - start) / len));
            return (
              <button key={c.id} onClick={() => seek(i)} className="group h-3 flex-1 px-px" style={{ flexGrow: len }} aria-label={`Go to chapter ${i + 1}: ${c.title}`}>
                <span className="block h-1 overflow-hidden rounded-pill group-hover:h-1.5" style={{ background: "rgb(245 246 246 / 0.25)" }}>
                  <span className="block h-full bg-teal" style={{ width: `${fill * 100}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption bar */}
      {!ended && (
        <div className="fixed inset-x-0 bottom-0 z-[70] px-4 py-3" style={{ background: "rgb(11 24 33 / 0.92)" }} aria-live="polite">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="text-small text-lilac">
                {String(chapter + 1).padStart(2, "0")} · {ch.title}
              </div>
              <p className="text-[20px] font-light leading-7 text-ink-on-stage">{ch.caption}</p>
            </div>
            <div className="flex items-center gap-1">
              <CtrlButton label="Previous chapter (Left arrow)" onClick={() => seek(Math.max(0, chapter - 1))}>
                <SkipBack size={18} strokeWidth={1.5} />
              </CtrlButton>
              <CtrlButton label={playing ? "Pause (Space)" : "Play (Space)"} onClick={() => (playing ? pause() : resume())} primary>
                {playing ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}
              </CtrlButton>
              <CtrlButton label="Next chapter (Right arrow)" onClick={() => seek(Math.min(CHAPTERS.length - 1, chapter + 1))}>
                <SkipForward size={18} strokeWidth={1.5} />
              </CtrlButton>
              <CtrlButton label="Restart" onClick={() => seek(0)}>
                <RotateCcw size={18} strokeWidth={1.5} />
              </CtrlButton>
              <button
                onClick={() => setSpeed(speed === 1 ? 1.5 : 1)}
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-button border border-ink-muted px-2 text-small text-ink-on-stage hover:border-ink-on-stage"
                aria-label={`Speed ${speed}x. Switch to ${speed === 1 ? 1.5 : 1}x`}
              >
                {speed}x
              </button>
              <button
                onClick={takeOver}
                className="ml-2 inline-flex h-11 items-center gap-2 rounded-button bg-white px-4 text-small text-teal hover:bg-surface-alt"
                data-tour="take-over"
              >
                <Hand size={16} strokeWidth={1.5} aria-hidden /> Take over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End card */}
      {ended && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-stage px-6">
          <div className="glow-stage pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative max-w-[640px] text-center">
            <p className="text-small text-lilac">End of the walkthrough</p>
            <h2 className="mt-2 text-[34px] leading-[40px] text-ink-on-stage">From inbox to a Legal-ready request, with every term cited.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-button bg-teal px-6 text-body text-white hover:opacity-90"
                onClick={async () => {
                  runId.current++;
                  await seekState(2);
                  takeOver();
                }}
              >
                <MousePointerClick size={18} strokeWidth={1.5} aria-hidden /> Try it yourself
              </button>
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-button border border-ink-muted px-6 text-body text-ink-on-stage hover:border-ink-on-stage"
                onClick={() => {
                  takeOver();
                  router.push("/metrics/");
                }}
              >
                <BarChart3 size={18} strokeWidth={1.5} aria-hidden /> See how we'd measure it
              </button>
            </div>
            <button className="mt-6 inline-flex min-h-11 items-center gap-2 text-small text-ink-on-stage underline-offset-4 hover:underline" onClick={() => seek(0)}>
              <RotateCcw size={15} strokeWidth={1.5} aria-hidden /> Replay
            </button>
          </div>
          <button onClick={takeOver} className="absolute right-4 top-16 inline-flex h-11 w-11 items-center justify-center rounded-button text-ink-on-stage hover:bg-ink" aria-label="Close walkthrough">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function CtrlButton({ label, onClick, children, primary }: { label: string; onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-11 w-11 items-center justify-center rounded-button",
        primary ? "bg-teal text-white hover:opacity-90" : "text-ink-on-stage hover:bg-ink",
      )}
    >
      {children}
    </button>
  );
}
