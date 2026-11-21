import type { Config } from "tailwindcss";

// The default Tailwind palette is replaced entirely by Sirion Kit tokens.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      surface: "var(--surface)",
      "surface-alt": "var(--surface-alt)",
      stage: "var(--surface-stage)",
      ink: "var(--ink)",
      "ink-muted": "var(--ink-muted)",
      "ink-on-stage": "var(--ink-on-stage)",
      line: "var(--line)",
      "line-strong": "var(--line-strong)",
      canvas: "var(--canvas)",
      tone: {
        "success-bg": "var(--tone-success-bg)",
        "success-fg": "var(--tone-success-fg)",
        "warn-bg": "var(--tone-warn-bg)",
        "warn-fg": "var(--tone-warn-fg)",
        "danger-bg": "var(--tone-danger-bg)",
        "danger-fg": "var(--tone-danger-fg)",
        "info-bg": "var(--tone-info-bg)",
        "info-fg": "var(--tone-info-fg)",
        "neutral-bg": "var(--tone-neutral-bg)",
      },
      mail: {
        blue: "var(--mail-blue)",
        "blue-dark": "var(--mail-blue-dark)",
        "blue-soft": "var(--mail-blue-soft)",
        selected: "var(--mail-selected)",
        bg: "var(--mail-bg)",
        pane: "var(--mail-pane)",
        text: "var(--mail-text)",
        muted: "var(--mail-muted)",
        line: "var(--mail-line)",
      },
      teal: "var(--brand-primary)",
      lilac: "var(--brand-secondary)",
      amethyst: { DEFAULT: "var(--brand-accent)", hover: "var(--brand-accent-hover)" },
      lapis: "var(--lapis)",
      mint: "var(--mint)",
      lime: "var(--lime)",
      quartz: "var(--quartz)",
      white: "var(--surface)",
    },
    borderRadius: {
      none: "0",
      chip: "var(--radius-chip)",
      button: "var(--radius-button)",
      card: "var(--radius-card)",
      pill: "var(--radius-pill)",
      full: "9999px",
    },
    fontFamily: {
      sans: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    fontSize: {
      display: ["44px", { lineHeight: "48px", letterSpacing: "-0.01em" }],
      h1: ["28px", { lineHeight: "34px", letterSpacing: "-0.01em" }],
      h2: ["22px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
      h3: ["17px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
      lead: ["18px", { lineHeight: "27px" }],
      body: ["16px", { lineHeight: "24px" }],
      small: ["13px", { lineHeight: "18px" }],
      xs: ["12px", { lineHeight: "16px" }],
      big: ["64px", { lineHeight: "64px", letterSpacing: "-0.02em" }],
    },
    boxShadow: { none: "none", glow: "var(--glow-teal)", card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
    extend: {
      // Sirion Kit spacing scale; Tailwind's 4 px scale stays for fine layout.
      spacing: { s1: "var(--space-1)", s2: "var(--space-2)", s3: "var(--space-3)", s4: "var(--space-4)", s5: "var(--space-5)" },
      transitionTimingFunction: { kit: "ease" },
      maxWidth: { prose: "65ch" },
    },
  },
  plugins: [],
};

export default config;
