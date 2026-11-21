"use client";

import Link from "next/link";
import { Play, ArrowRight, Film as FilmIcon, BookOpen } from "lucide-react";
import { startFilm } from "@/components/walkthrough/Film";

export function StartHero() {
  return (
    <div className="on-stage relative flex min-h-[100dvh] flex-col overflow-hidden bg-stage text-ink-on-stage lg:h-[100dvh] lg:min-h-0">
      <div className="glow-stage pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_520px] lg:px-10">
        <div>
          <span className="inline-flex rounded-pill border border-ink-muted px-3 py-0.5 text-xs text-lilac">Sirion APM case · Stage: contract intake</span>
          <h1 className="mt-4 text-[34px] leading-[40px] tracking-[-0.01em] text-ink-on-stage md:text-display">
            The deal is agreed in email. Sirion should not need it retyped.
          </h1>
          <p className="mt-4 max-w-prose text-lead font-light">
            <span className="text-lilac">Problem.</span> Procurement agrees supplier deals over email, then retypes them into Sirion's intake form. Conditions and open items get lost on the way.
          </p>
          <p className="mt-2 max-w-prose text-lead font-light">
            <span className="text-lilac">Bet.</span> A Sirion sidebar in Outlook and Gmail adds the deal's emails to a deal ID and builds the request from them, every term cited.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => startFilm(0)}
              className="inline-flex min-h-12 items-center gap-2 rounded-button bg-amethyst px-6 text-body text-white hover:bg-amethyst-hover"
              data-tour="watch"
            >
              <Play size={18} strokeWidth={1.5} aria-hidden /> Watch the 2-minute walkthrough
            </button>
            <Link href="/product/" className="inline-flex min-h-12 items-center gap-2 rounded-button border border-ink-muted px-5 text-body text-ink-on-stage hover:border-ink-on-stage">
              Try it yourself <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Link>
            <Link href="/why/" className="inline-flex min-h-12 items-center gap-2 px-3 text-body text-ink-on-stage underline-offset-4 hover:underline">
              <BookOpen size={16} strokeWidth={1.5} aria-hidden /> Read the case
            </Link>
          </div>
          <p className="mt-6 max-w-prose text-small text-ink-on-stage">
            AI outputs are pre-written examples of what the model returns. The checks that decide what counts as agreed run live in your browser.
          </p>
          <a href="/walkthrough.mp4" className="mt-2 inline-flex min-h-11 items-center gap-2 text-small text-lilac underline-offset-4 hover:underline">
            <FilmIcon size={15} strokeWidth={1.5} aria-hidden /> Can't run it? Watch the recording.
          </a>
        </div>
        <figure className="relative hidden lg:block" aria-label="The Sirion sidebar beside a supplier email">
          <div className="overflow-hidden rounded-card border border-ink-muted shadow-glow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero.png" alt="Mock inbox with the Sirion sidebar showing what's agreed so far for deal DL-1042" width={1040} height={1200} className="block h-auto w-full" />
          </div>
          <figcaption className="mt-3 text-xs text-ink-on-stage">Mock of the Outlook and Gmail add-in. Synthetic data.</figcaption>
        </figure>
      </div>
      <dl className="relative mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-4 border-t border-ink-muted px-5 py-4 text-small md:grid-cols-4 lg:px-10">
        {[
          ["Built for", "The procurement contract owner who raises the request"],
          ["Also serves", "Legal, who receives a cited brief"],
          ["North star", "Clean intake rate"],
          ["Ten-minute path", "Film, then one exploration deal, then Metrics"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-lilac">{k}</dt>
            <dd className="text-ink-on-stage">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
