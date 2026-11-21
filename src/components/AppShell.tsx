"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Home, Compass, AlertCircle, Users, ListChecks, Inbox, Gauge, Route, BookOpen, CircleDot } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cx } from "@/components/ui";
import { hydrateFromSession } from "@/lib/store";
import { Film } from "@/components/walkthrough/Film";

const ICONS = { Home, Compass, AlertCircle, Users, ListChecks, Inbox, Gauge, Route, BookOpen } as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const norm = path.endsWith("/") ? path : path + "/";
  useEffect(() => hydrateFromSession(), []);
  // The live product gets the room: the section nav collapses to an icon rail there.
  const compact = norm === "/product/";
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-button focus:bg-white focus:p-3">
        Skip to content
      </a>
      <nav aria-label="Sections" className={cx("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface-alt py-5 lg:flex", compact ? "w-[64px] px-2" : "w-[208px] px-3")}>
        <Link href="/" className={cx("mb-6 flex min-h-11 items-center gap-2 text-h3 text-ink", compact ? "justify-center px-0" : "px-3")} aria-label={compact ? "Sirion Inbox-to-Intake, start" : undefined}>
          <CircleDot size={18} strokeWidth={1.5} className="text-teal" aria-hidden />
          <span className={compact ? "sr-only" : undefined}>
            Sirion <span className="text-ink-muted">Inbox-to-Intake</span>
          </span>
        </Link>
        <ol className="flex flex-col gap-0.5">
          {NAV.map((n, i) => {
            const Icon = ICONS[n.icon];
            const active = norm === n.href;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  title={compact ? n.label : undefined}
                  className={cx(
                    "flex min-h-11 items-center gap-3 rounded-button text-small",
                    compact ? "justify-center px-0" : "px-3",
                    active ? "bg-white text-teal" : "text-ink hover:bg-white",
                  )}
                  style={active ? { boxShadow: "inset 0 0 0 1px var(--line)" } : undefined}
                >
                  <Icon size={17} strokeWidth={1.5} aria-hidden />
                  <span className={compact ? "sr-only" : "flex-1"}>{n.label}</span>
                  {!compact && <span className="text-xs text-ink-muted">{i + 1}</span>}
                </Link>
              </li>
            );
          })}
        </ol>
        <p className={cx("mt-auto px-3 text-xs leading-4 text-ink-muted", compact && "sr-only")}>
          A candidate prototype for the Sirion APM case. Not a Sirion product. All data is synthetic.
        </p>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col pb-[64px] lg:pb-0">
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-line bg-white lg:hidden">
        {NAV.map((n) => {
          const Icon = ICONS[n.icon];
          const active = norm === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cx("flex min-h-[60px] min-w-[72px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs", active ? "text-teal" : "text-ink-muted")}
            >
              <Icon size={18} strokeWidth={1.5} aria-hidden />
              {n.short}
            </Link>
          );
        })}
      </nav>
      <Film />
    </div>
  );
}
