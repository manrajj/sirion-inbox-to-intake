"use client";

import * as React from "react";
import clsx from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import * as RTabs from "@radix-ui/react-tabs";
import {
  Check,
  Clock,
  Split,
  Flag,
  Pencil,
  CircleDashed,
  ShieldAlert,
  ArrowUpRight,
  Repeat,
  Undo2,
  EyeOff,
  X,
  AlertTriangle,
} from "lucide-react";
import type { DisplayStatus } from "@/lib/types";

export const cx = clsx;

// ---------------------------------------------------------------- Buttons

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "accent" | "stage";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "md" | "sm"; icon?: React.ReactNode }
>(function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }, ref) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-button font-sans select-none disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";
  const sizes = size === "md" ? "min-h-11 px-5 text-body" : "min-h-11 px-3 text-small";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-teal text-white hover:opacity-90",
    secondary: "bg-white text-teal border border-line hover:bg-surface-alt",
    ghost: "text-teal hover:bg-surface-alt",
    destructive: "bg-quartz text-ink hover:opacity-90",
    accent: "bg-amethyst text-white hover:bg-amethyst-hover",
    stage: "bg-transparent text-ink-on-stage border border-ink-muted hover:border-ink-on-stage",
  };
  return (
    <button ref={ref} className={cx(base, sizes, variants[variant], className)} {...rest}>
      {variant === "destructive" && !icon ? <AlertTriangle size={16} strokeWidth={1.5} aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ---------------------------------------------------------------- Status badges

const STATUS: Record<DisplayStatus, { label: string; icon: React.ElementType; cls: string }> = {
  accepted: { label: "Accepted by both", icon: Check, cls: "bg-teal text-white" },
  conditional: { label: "Conditional", icon: Clock, cls: "bg-lime text-ink" },
  conflict: { label: "Conflict", icon: Split, cls: "bg-quartz text-ink" },
  openForLegal: { label: "Open for Legal", icon: Flag, cls: "bg-lilac text-ink" },
  offEmail: { label: "Owner-entered", icon: Pencil, cls: "bg-mint text-ink" },
  notNegotiated: { label: "Not yet negotiated", icon: CircleDashed, cls: "bg-white border border-line text-ink-muted" },
  proposed: { label: "Proposed", icon: ArrowUpRight, cls: "bg-white border border-ink-muted text-ink" },
  countered: { label: "Countered", icon: Repeat, cls: "bg-white border border-ink-muted text-ink" },
  withdrawn: { label: "Withdrawn", icon: Undo2, cls: "bg-white border border-ink-muted text-ink" },
  heldBack: { label: "Held back", icon: EyeOff, cls: "bg-white border-2 border-quartz text-ink" },
};

export const STEP_STATUS: Record<string, DisplayStatus> = {
  offer: "proposed",
  counter: "countered",
  condition: "conditional",
  resolution: "accepted",
  acceptance: "accepted",
  withdrawal: "withdrawn",
  statement: "proposed",
};

export function StatusBadge({ status, className, label }: { status: DisplayStatus; className?: string; label?: string }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs whitespace-nowrap", s.cls, className)} style={{ paddingLeft: 10, paddingRight: 10 }}>
      <Icon size={13} strokeWidth={1.75} aria-hidden />
      {label ?? s.label}
    </span>
  );
}

export function statusLabel(s: DisplayStatus) {
  return STATUS[s].label;
}

export function SuspiciousBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-quartz px-2.5 py-0.5 text-xs text-ink" style={{ paddingLeft: 10, paddingRight: 10 }}>
      <ShieldAlert size={13} strokeWidth={1.75} aria-hidden />
      Suspicious
    </span>
  );
}

// ---------------------------------------------------------------- Honesty chips

export type Honesty = "ai" | "live" | "mocked";
const HONESTY: Record<Honesty, string> = { ai: "Example AI output", live: "Live check", mocked: "Mocked" };

export function HonestyChip({ kind, className, title }: { kind: Honesty; className?: string; title?: string }) {
  return (
    <span
      title={title ?? HONESTY[kind]}
      className={cx("inline-flex items-center rounded-pill border px-2 text-xs leading-5 text-ink-muted whitespace-nowrap", className)}
      style={{ borderColor: "var(--line)" }}
    >
      {HONESTY[kind]}
    </span>
  );
}

export function Eyebrow({ children, stage }: { children: React.ReactNode; stage?: boolean }) {
  return (
    <span className={cx("inline-flex rounded-pill px-3 py-0.5 text-xs", stage ? "border border-ink-muted text-lilac" : "bg-surface-alt text-ink-muted")}>{children}</span>
  );
}

// ---------------------------------------------------------------- Cards

export function Card({ className, children, as: As = "div", ...rest }: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <As className={cx("rounded-card border border-line bg-white p-6", className)} {...rest}>
      {children}
    </As>
  );
}

// ---------------------------------------------------------------- Checkbox (44 px target)

export function Tick({
  checked,
  onChange,
  label,
  sub,
  disabled,
  className,
  id,
  tour,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  sub?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  tour?: string;
}) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} data-tour={tour} className={cx("flex min-h-11 cursor-pointer items-center gap-3 rounded-chip px-2 hover:bg-surface-alt", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded-[5px] border border-ink-muted bg-white checked:border-teal checked:bg-teal"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Check size={14} strokeWidth={2.25} className="pointer-events-none relative text-white opacity-0 peer-checked:opacity-100" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small text-ink">{label}</span>
        {sub && <span className="block text-xs text-ink-muted">{sub}</span>}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------- Drawer and modal

export function Drawer({
  trigger,
  title,
  children,
  open,
  onOpenChange,
  width = 560,
}: {
  trigger?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  width?: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 fade-in" style={{ background: "rgb(11 24 33 / 0.4)" }} />
        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full max-w-full flex-col border-l border-line bg-white fade-in"
          style={{ width }}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <Dialog.Title className="text-h2 text-ink">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-button text-ink-muted hover:bg-surface-alt" aria-label="Close">
                <X size={18} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>
          <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  width = 520,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 fade-in" style={{ background: "rgb(11 24 33 / 0.4)" }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-white p-6 fade-in"
          style={{ maxWidth: width }}
          aria-describedby={undefined}
          data-tour="modal"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-h2 text-ink">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="-mr-2 -mt-2 inline-flex h-11 w-11 items-center justify-center rounded-button text-ink-muted hover:bg-surface-alt" aria-label="Close">
                <X size={18} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------- Tabs

export function Tabs({
  tabs,
  value,
  onValueChange,
  className,
  listClassName,
}: {
  tabs: { id: string; label: React.ReactNode; content: React.ReactNode; tour?: string }[];
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  listClassName?: string;
}) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} defaultValue={tabs[0].id} className={className}>
      <RTabs.List className={cx("thin-scroll flex gap-1 overflow-x-auto border-b border-line", listClassName)} aria-label="Sections">
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.id}
            value={t.id}
            data-tour={t.tour}
            className="-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent px-4 text-small text-ink-muted hover:text-ink data-[state=active]:border-teal data-[state=active]:text-teal"
          >
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {tabs.map((t) => (
        <RTabs.Content key={t.id} value={t.id} className="fade-in outline-none">
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}

// ---------------------------------------------------------------- Formatting

export function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${date}, ${time}`;
}

export function SectionTitle({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="mb-6">
      {eyebrow && <div className="mb-2"><Eyebrow>{eyebrow}</Eyebrow></div>}
      <h1 className="text-display text-ink">{title}</h1>
      {lead && <p className="mt-3 max-w-prose text-lead font-light text-ink-muted">{lead}</p>}
    </header>
  );
}
