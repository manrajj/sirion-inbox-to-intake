// The five items the brief asks for, in order. Nothing else gets a page.
export const NAV = [
  { href: "/why/", label: "Why this stage", short: "Why" },
  { href: "/stakeholders/", label: "Stakeholders", short: "People" },
  { href: "/problem/", label: "Problem", short: "Problem" },
  { href: "/product/", label: "Prototype", short: "Prototype" },
  { href: "/metrics/", label: "Metrics", short: "Metrics" },
] as const;

/** For now the site shows only the prototype, full screen. Flip to bring the narrative back into view. */
export const SHOW_NARRATIVE = false;
