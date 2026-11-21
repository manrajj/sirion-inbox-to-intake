/* eslint-disable @next/next/no-img-element */
import { cx } from "@/components/ui";

// Sirion's own logo, from the image the user supplied (public/brand, DECISIONS C7/C9):
// the swirl mark alone, and the full logo with the "sirion" wordmark.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Loads every logo variant up front, so views opened later (or offline) never miss one. */
export function PreloadLogos() {
  return (
    <span hidden aria-hidden>
      {["sirion-mark", "sirion-logo", "sirion-logo-white"].map((n) => (
        <img key={n} src={`${BASE}/brand/${n}.png`} alt="" />
      ))}
    </span>
  );
}

/** The Sirion swirl. `size` is the height in px. */
export function SirionMark({ size = 20, className }: { size?: number; className?: string; inverse?: boolean }) {
  return <img src={`${BASE}/brand/sirion-mark.png`} alt="" aria-hidden height={size} width={Math.round((size * 87) / 79)} className={cx("shrink-0", className)} />;
}

/** The full Sirion logo. `size` is the height in px; `inverse` gives the white version for dark bars. */
export function SirionLogo({ size = 20, className, inverse }: { size?: number; className?: string; inverse?: boolean }) {
  return (
    <img
      src={`${BASE}/brand/${inverse ? "sirion-logo-white" : "sirion-logo"}.png`}
      alt="Sirion"
      height={size}
      width={Math.round((size * 344) / 79)}
      className={cx("shrink-0", className)}
    />
  );
}
