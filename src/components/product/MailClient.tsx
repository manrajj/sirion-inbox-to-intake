"use client";

import { Inbox, Send, FileEdit, Archive, Paperclip, CircleDot, Reply, Forward, Star } from "lucide-react";
import { actions, useApp, threadOf } from "@/lib/store";
import { getDeal } from "@data/index";
import { cx, fmtDate, HonestyChip } from "@/components/ui";
import { Highlighted } from "./SourceText";
import { Sidebar } from "./Sidebar";

// Deliberately neutral mail styling (ink-muted, line, surface-alt) so the Sirion pane reads as an add-in.

export function MailClient() {
  const dealId = useApp((s) => s.dealId);
  const openId = useApp((s) => s.openMessageId);
  const sidebarOpen = useApp((s) => s.sidebarOpen);
  const deal = getDeal(dealId);
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const openThread = threadOf(deal, openId);
  const rows = deal.threads
    .map((t) => {
      const emails = t.messageIds.map((id) => byId.get(id)!).filter((m) => m.kind === "email");
      const latest = emails[emails.length - 1];
      return { t, latest, count: emails.length, hasAttachment: t.messageIds.some((id) => byId.get(id)!.kind === "pdf") };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
  const threadMsgs = openThread.messageIds.map((id) => byId.get(id)!).filter((m) => m.kind === "email");

  return (
    <div className="flex h-full min-h-0 flex-col" data-tour="inbox">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-alt px-4 py-2">
        <span className="text-small text-ink-muted">Mail · sam.okafor@halden.example</span>
        <span className="flex items-center gap-2">
          <HonestyChip kind="mocked" title="Mock of the Outlook and Gmail add-in" />
          <span className="text-xs text-ink-muted">Mock of the Outlook and Gmail add-in</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Folder list */}
        <aside className="hidden w-[132px] shrink-0 flex-col gap-0.5 border-r border-line bg-surface-alt p-2 xl:flex" aria-label="Folders">
          {[
            { icon: Inbox, label: "Inbox", n: rows.length },
            { icon: Send, label: "Sent" },
            { icon: FileEdit, label: "Drafts" },
            { icon: Archive, label: "Archive" },
          ].map((f, i) => (
            <div key={f.label} className={cx("flex min-h-9 items-center gap-2 rounded-chip px-2 text-small", i === 0 ? "bg-white text-ink" : "text-ink-muted")}>
              <f.icon size={15} strokeWidth={1.5} aria-hidden />
              <span className="flex-1">{f.label}</span>
              {f.n ? <span className="text-xs">{f.n}</span> : null}
            </div>
          ))}
        </aside>

        {/* Message list */}
        <ul className={cx("thin-scroll w-[250px] shrink-0 overflow-y-auto border-r border-line", sidebarOpen && "hidden md:block")} aria-label="Messages">
          {rows.map(({ t, latest, count, hasAttachment }) => {
            const active = t.id === openThread.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => actions.openMessage(latest.id)}
                  data-tour={`thread-${t.id}`}
                  className={cx("block w-full border-b border-line px-3 py-2.5 text-left", active ? "bg-surface-alt" : "hover:bg-surface-alt")}
                  aria-current={active ? "true" : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-small text-ink">{latest.from.name}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{fmtDate(latest.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate text-xs text-ink">
                    {hasAttachment && <Paperclip size={12} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-label="Has attachment" />}
                    <span className="truncate">{t.subject}</span>
                    {count > 1 && <span className="shrink-0 text-ink-muted">({count})</span>}
                  </div>
                  <div className="truncate text-xs text-ink-muted">{latest.body.replace(/\s+/g, " ").slice(0, 80)}</div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Reading pane */}
        <section className={cx("flex min-w-0 flex-1 flex-col", sidebarOpen && "hidden md:flex")} aria-label="Reading pane">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <h2 className="truncate text-h3 text-ink">{openThread.subject}</h2>
            <div className="flex shrink-0 items-center gap-1">
              {[Reply, Forward, Star].map((I, i) => (
                <span key={i} className="inline-flex h-9 w-9 items-center justify-center rounded-chip text-ink-muted" aria-hidden>
                  <I size={16} strokeWidth={1.5} />
                </span>
              ))}
              <button
                data-tour="open-sidebar"
                onClick={() => actions.toggleSidebar()}
                aria-pressed={sidebarOpen}
                className={cx(
                  "ml-1 inline-flex min-h-11 items-center gap-2 rounded-button border px-3 text-small",
                  sidebarOpen ? "border-teal bg-white text-teal" : "border-line bg-white text-ink hover:bg-surface-alt",
                )}
              >
                <CircleDot size={15} strokeWidth={1.5} className="text-teal" aria-hidden />
                Sirion
              </button>
            </div>
          </div>
          <div className="thin-scroll flex-1 overflow-y-auto px-4 py-3">
            {threadMsgs.map((m) => {
              const isOpen = m.id === openId;
              return (
                <article key={m.id} className={cx("mb-3 rounded-chip border border-line", isOpen ? "bg-white" : "bg-surface-alt")}>
                  <button className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left" onClick={() => actions.openMessage(m.id)} aria-expanded={isOpen}>
                    <span className="truncate text-small text-ink">
                      {m.from.name} <span className="text-xs text-ink-muted">&lt;{m.from.email}&gt;</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">{fmtDate(m.date, true)}</span>
                  </button>
                  {isOpen ? (
                    <div className="px-3 pb-3">
                      <div className="whitespace-pre-wrap text-small leading-6 text-ink">
                        <Highlighted text={m.body} />
                      </div>
                      {(m.attachmentIds ?? []).map((aid) => {
                        const a = byId.get(aid)!;
                        return (
                          <div key={aid} className="mt-3 inline-flex items-center gap-2 rounded-chip border border-line px-3 py-2 text-xs text-ink" data-tour="attachment">
                            <Paperclip size={14} strokeWidth={1.5} aria-hidden />
                            {a.filename}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="truncate px-3 pb-2 text-xs text-ink-muted">{m.body.replace(/\s+/g, " ").slice(0, 110)}</div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {sidebarOpen && <Sidebar />}
      </div>
    </div>
  );
}
