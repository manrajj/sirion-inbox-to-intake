import { cx } from "@/components/ui";

/** A generic mark for the mock Sirion surfaces. Deliberately not Sirion's logo. */
export function SirionMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cx("shrink-0", className)} aria-hidden>
      <rect width="24" height="24" rx="7" fill="var(--brand-primary)" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--surface)" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.8" fill="var(--surface)" />
    </svg>
  );
}
