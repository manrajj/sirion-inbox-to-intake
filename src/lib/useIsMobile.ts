"use client";

import { useEffect, useState } from "react";

/** True below 768px, where the prototype shows Outlook mobile and Sirion mobile. Null until known. */
export function useIsMobile(): boolean | null {
  const [m, setM] = useState<boolean | null>(null);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const f = () => setM(q.matches);
    f();
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  return m;
}
