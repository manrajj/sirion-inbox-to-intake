"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { fmtDate, cx } from "@/components/ui";
import { FileText } from "lucide-react";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders a message body with the cited sentence highlighted (whitespace-tolerant). */
export function Highlighted({ text, quote }: { text: string; quote?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [quote]);
  if (!quote) return <>{text}</>;
  const pattern = new RegExp(quote.trim().split(/\s+/).map(escapeRe).join("\\s+"));
  const m = text.match(pattern);
  if (!m || m.index === undefined) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.index)}
      <mark ref={ref} key={quote} className="cite-mark text-ink" data-tour="cite-mark">
        {m[0]}
      </mark>
      {text.slice(m.index + m[0].length)}
    </>
  );
}

export function SourceMessage({ message, quote, compact }: { message: Message; quote?: string; compact?: boolean }) {
  return (
    <article className={cx("text-small", compact ? "" : "")} aria-label={`Source: ${message.filename ?? message.subject}`}>
      <header className="mb-3 border-b border-line pb-3">
        {message.kind === "pdf" ? (
          <div className="flex items-center gap-2 text-ink">
            <FileText size={16} strokeWidth={1.5} aria-hidden /> {message.filename}
          </div>
        ) : (
          <div className="text-ink">{message.subject}</div>
        )}
        <div className="mt-1 text-xs text-ink-muted">
          {message.from.name} &lt;{message.from.email}&gt; · {fmtDate(message.date, true)}
        </div>
      </header>
      {message.readable === false ? (
        <p className="text-ink-muted">{message.unreadableReason}</p>
      ) : (
        <div className={cx("whitespace-pre-wrap leading-6 text-ink", message.kind === "pdf" && "font-mono text-xs leading-5")}>
          <Highlighted text={message.body} quote={quote} />
        </div>
      )}
    </article>
  );
}
