"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CircleDot, Play, NotebookText } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cx } from "@/components/ui";
import { hydrateFromSession } from "@/lib/store";
import { Film, startFilm } from "@/components/walkthrough/Film";
import { NotesDrawer } from "@/components/narrative/NotesDrawer";

export const TOPBAR_H = 56;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const norm = path.endsWith("/") ? path : path + "/";
  useEffect(() => hydrateFromSession(), []);
  // The prototype shows full screen, with no site header. Narrative pages keep the header.
  const fullScreen = norm === "/" || norm === "/product/" || norm === "/about/";
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-button focus:bg-white focus:p-3">
        Skip to content
      </a>
      {!fullScreen && (
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-3 lg:px-5">
        <Link href="/why/" className="hidden min-h-11 shrink-0 items-center gap-2 pr-2 text-h3 text-ink md:flex">
          <CircleDot size={18} strokeWidth={1.5} className="text-teal" aria-hidden />
          <span>
            Inbox-to-Intake <span className="hidden text-ink-muted xl:inline">· Sirion APM case</span>
          </span>
        </Link>
        <nav aria-label="Sections" className="thin-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:justify-center">
          <ol className="flex items-center gap-1">
            {NAV.map((n, i) => {
              const active = norm === n.href;
              return (
                <li key={n.href} className="flex items-center">
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-pill px-3 text-small",
                      active ? "bg-tone-success-bg text-teal" : "text-ink hover:bg-surface-alt",
                    )}
                  >
                    <span
                      className={cx(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                        active ? "bg-teal text-white" : "border border-line-strong text-ink-muted",
                      )}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className="hidden sm:inline">{n.label}</span>
                    <span className="sm:hidden">{n.short}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <NotesDrawer
            trigger={
              <button className="inline-flex min-h-11 items-center gap-2 rounded-button px-3 text-small text-teal hover:bg-surface-alt" aria-label="Assumptions and sources">
                <NotebookText size={16} strokeWidth={1.5} aria-hidden />
                <span className="hidden lg:inline">Assumptions</span>
              </button>
            }
          />
          <button
            onClick={() => startFilm(0)}
            className="inline-flex min-h-11 items-center gap-2 rounded-button bg-amethyst px-4 text-small text-white hover:bg-amethyst-hover"
            data-tour="watch"
          >
            <Play size={15} strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">Watch walkthrough</span>
            <span className="sm:hidden">Watch</span>
          </button>
        </div>
      </header>
      )}
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
      <Film />
    </div>
  );
}
