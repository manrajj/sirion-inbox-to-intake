import { cx } from "@/components/ui";

// Sirion's logo, redrawn as an SVG approximation for the mock (DECISIONS C7):
// four nested rounded loops that cross over in the middle, and the lowercase "sirion" wordmark.

const W = 44;
const H = 28;
const N = 4;
const GAP = 2.7;

function ring(j: number) {
  const x0 = j * GAP + 1;
  const x1 = W - j * GAP - 1;
  const y0 = j * GAP + 1;
  const y1 = H - j * GAP - 1;
  return { x0, x1, y0, y1, r: (y1 - y0) / 2 };
}

const f = (n: number) => n.toFixed(2);

function strand(k: number) {
  const a = ring(k);
  const b = ring(N - 1 - k);
  const tx = W / 2 - 3;
  const bx = W / 2 + 3;
  const d = 6;
  return (
    `M${f(tx - d)},${f(a.y0)} L${f(a.x0 + a.r)},${f(a.y0)} A${f(a.r)},${f(a.r)} 0 0 0 ${f(a.x0 + a.r)},${f(a.y1)} L${f(bx - d)},${f(a.y1)} ` +
    `C${f(bx)},${f(a.y1)} ${f(bx)},${f(b.y1)} ${f(bx + d)},${f(b.y1)} L${f(b.x1 - b.r)},${f(b.y1)} A${f(b.r)},${f(b.r)} 0 0 0 ${f(b.x1 - b.r)},${f(b.y0)} L${f(tx + d)},${f(b.y0)} ` +
    `C${f(tx)},${f(b.y0)} ${f(tx)},${f(a.y0)} ${f(tx - d)},${f(a.y0)} Z`
  );
}

const PATHS = Array.from({ length: N }, (_, k) => strand(k));

/** The Sirion swirl. `size` is the height in px. */
export function SirionMark({ size = 20, className, inverse }: { size?: number; className?: string; inverse?: boolean }) {
  return (
    <svg
      width={(size * W) / H}
      height={size}
      viewBox={`-0.6 -0.6 ${W + 1.2} ${H + 1.2}`}
      fill="none"
      stroke={inverse ? "var(--surface)" : "var(--brand-primary)"}
      strokeWidth={1.25}
      className={cx("shrink-0", className)}
      aria-hidden
    >
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Swirl plus the lowercase wordmark, as in Sirion's own logo. */
export function SirionLogo({ size = 20, className, inverse }: { size?: number; className?: string; inverse?: boolean }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-[0.35em]", className)} style={{ fontSize: size }} aria-label="Sirion">
      <SirionMark size={size} inverse={inverse} />
      <span
        aria-hidden
        className={cx("font-medium leading-none", inverse ? "text-white" : "text-teal")}
        style={{ fontSize: size * 1.05, letterSpacing: "0.01em" }}
      >
        sirion
      </span>
    </span>
  );
}
