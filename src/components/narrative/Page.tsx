import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui";

export function NarrativePage({
  eyebrow,
  title,
  lead,
  next,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  next?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas">
      <div className="mx-auto flex min-h-[calc(100dvh-56px)] max-w-[1120px] flex-col px-5 pb-6 pt-6 lg:h-[calc(100dvh-56px)] lg:min-h-0 lg:px-10">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-2 max-w-[820px] text-h1 text-ink md:text-[36px] md:leading-[42px]">{title}</h1>
            {lead && (
              <p className="mt-2 max-w-prose text-lead font-light text-ink-muted">
                {lead}
              </p>
            )}
          </div>
          {next && (
            <Link
              href={next.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-button border border-line bg-white px-4 text-small text-teal shadow-card hover:bg-surface-alt"
            >
              {next.label}{" "}
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
            </Link>
          )}
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function SourceTag({
  type,
  children,
}: {
  type:
    | "Reported"
    | "Observed"
    | "Assumption"
    | "Illustrative"
    | "Open hypothesis"
    | "Sourced";
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-line px-2 text-xs leading-5 text-ink-muted">
      {type}
      {children && <span className="text-ink-muted">· {children}</span>}
    </span>
  );
}
