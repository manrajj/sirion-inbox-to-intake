import { cx } from "@/components/ui";

/** A generic mark for the mock Sirion surfaces. Deliberately not Sirion's logo. */
export function SirionMark({ size = 20, className, inverse }: { size?: number; className?: string; inverse?: boolean }) {
  const bg = inverse ? "var(--surface)" : "var(--brand-primary)";
  const fg = inverse ? "var(--brand-primary)" : "var(--surface)";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cx("shrink-0", className)} aria-hidden>
      <rect width="24" height="24" rx="7" fill={bg} />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke={fg} strokeWidth="2" />
      <circle cx="12" cy="12" r="1.8" fill={fg} />
    </svg>
  );
}
