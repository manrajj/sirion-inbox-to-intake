"use client";

import { ChevronLeft, Search, Bell, ListFilter, Paperclip, Mail, CalendarDays, LayoutGrid, SquarePen, Archive, Trash, Ellipsis, Reply, ReplyAll, Forward } from "lucide-react";
import { actions, useApp, threadOf } from "@/lib/store";
import { getDeal } from "@data/index";
import { BUYER_DOMAIN, domainOf } from "@/lib/checks";
import { cx, fmtDate } from "@/components/ui";
import { Highlighted } from "./SourceText";
import { Sidebar } from "./Sidebar";
import { SirionMark } from "./SirionMark";
import { Avatar } from "./MailClient";

// Outlook on a phone, in the layout of the Outlook mobile app: the inbox as a full-screen
// list with Focused and Other, a tab bar and a compose button; a conversation opens full
// screen; the Sirion add-in opens as a full-screen sheet over the message.

const ME = { name: "Manraj Singh", email: `manraj.singh@${BUYER_DOMAIN}` };

export function MailMobile() {
  const screen = useApp((s) => s.mailScreen ?? "list");
  const sidebarOpen = useApp((s) => s.sidebarOpen);
  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white text-mail-text" data-tour="inbox">
      {screen === "list" ? <InboxList /> : <Conversation />}
      {sidebarOpen && (
        <div className="sheet-up absolute inset-0 z-20 flex flex-col bg-addin-bg">
          <Sidebar mobile />
        </div>
      )}
    </div>
  );
}

function InboxList() {
  const dealId = useApp((s) => s.dealId);
  const deal = getDeal(dealId);
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const rows = deal.threads
    .map((t) => {
      const emails = t.messageIds.map((id) => byId.get(id)!).filter((m) => m.kind === "email");
      const latest = emails[emails.length - 1];
      return {
        t,
        latest,
        count: emails.length,
        hasAttachment: t.messageIds.some((id) => byId.get(id)!.kind === "pdf"),
        unread: domainOf(latest.from.email) !== BUYER_DOMAIN,
      };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
  return (
    <>
      <header className="shrink-0 px-4 pb-1 pt-2">
        <div className="flex h-11 items-center gap-3">
          <span className="relative">
            <Avatar person={ME} size={32} />
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-mail-blue" />
            </span>
          </span>
          <h1 className="text-[22px] font-semibold">Inbox</h1>
          <span className="ml-auto flex items-center gap-4 text-mail-text" aria-hidden>
            <Search size={21} strokeWidth={1.75} />
            <Bell size={21} strokeWidth={1.75} />
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between" aria-hidden>
          <span className="inline-flex rounded-pill bg-mail-pane p-0.5 text-small">
            <span className="rounded-pill bg-white px-3 py-1 font-semibold shadow-card">Focused</span>
            <span className="px-3 py-1 text-mail-muted">Other</span>
          </span>
          <span className="inline-flex items-center gap-1 text-small text-mail-blue">
            <ListFilter size={16} strokeWidth={1.75} /> Filter
          </span>
        </div>
      </header>
      <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto" aria-label="Messages">
        {rows.map(({ t, latest, count, hasAttachment, unread }) => (
          <li key={t.id}>
            <button
              onClick={() => {
                actions.openMessage(latest.id);
                actions.setMailScreen("read");
              }}
              data-tour={`thread-${t.id}`}
              className="flex w-full gap-3 px-4 py-3 text-left active:bg-mail-blue-soft"
            >
              <Avatar person={latest.from} size={40} />
              <span className="min-w-0 flex-1 border-b border-mail-line pb-3">
                <span className="flex items-center gap-2">
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-mail-blue" aria-label="Unread" />}
                  <span className={cx("truncate text-[15px]", unread ? "font-semibold" : "")}>{latest.from.name}</span>
                  <span className={cx("ml-auto shrink-0 text-xs", unread ? "font-semibold text-mail-blue" : "text-mail-muted")}>{fmtDate(latest.date)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-small">
                  <span className={cx("truncate", unread && "font-semibold")}>{t.subject}</span>
                  {count > 1 && <span className="shrink-0 text-xs text-mail-muted">{count}</span>}
                  {hasAttachment && <Paperclip size={13} strokeWidth={1.75} className="ml-auto shrink-0 text-mail-muted" aria-label="Has attachment" />}
                </span>
                <span className="mt-0.5 line-clamp-2 text-small text-mail-muted">{latest.body.replace(/\s+/g, " ").slice(0, 140)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <span className="absolute bottom-[72px] right-4 inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-mail-blue text-white shadow-pop" aria-hidden>
        <SquarePen size={22} strokeWidth={1.75} />
      </span>
      <nav className="flex h-14 shrink-0 items-center justify-around border-t border-mail-line bg-white text-[11px]" aria-hidden>
        {[
          { I: Mail, l: "Mail", on: true },
          { I: CalendarDays, l: "Calendar" },
          { I: Search, l: "Search" },
          { I: LayoutGrid, l: "Apps" },
        ].map(({ I, l, on }) => (
          <span key={l} className={cx("flex flex-col items-center gap-0.5", on ? "text-mail-blue" : "text-mail-muted")}>
            <I size={21} strokeWidth={on ? 2 : 1.75} />
            {l}
          </span>
        ))}
      </nav>
    </>
  );
}

function Conversation() {
  const dealId = useApp((s) => s.dealId);
  const openId = useApp((s) => s.openMessageId);
  const source = useApp((s) => s.source);
  const picked = useApp((s) => !!s.deals[s.dealId].pickedDealId);
  const deal = getDeal(dealId);
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const thread = threadOf(deal, openId);
  const msgs = thread.messageIds.map((id) => byId.get(id)!).filter((m) => m.kind === "email");
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1 px-1 text-mail-text">
        <button onClick={() => actions.setMailScreen("list")} className="inline-flex h-11 items-center gap-0.5 pr-2 text-mail-blue" aria-label="Back to Inbox" data-tour="mail-back">
          <ChevronLeft size={24} strokeWidth={1.75} /> <span className="text-[15px]">Inbox</span>
        </button>
        {picked && source?.quote ? (
          // Back to the add-in after reading a quoted sentence
          <button
            onClick={() => actions.toggleSidebar(true)}
            className="ml-auto mr-2 inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-teal px-3 text-small text-white"
            data-tour="back-to-addin"
          >
            <SirionMark size={12} /> Back to Sirion
          </button>
        ) : (
          <span className="ml-auto flex items-center gap-4 pr-3" aria-hidden>
            <Archive size={20} strokeWidth={1.75} />
            <Trash size={20} strokeWidth={1.75} />
            <Ellipsis size={20} strokeWidth={1.75} />
          </span>
        )}
      </header>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto pb-24">
        <div className="px-4 pb-2 pt-1">
          <h1 className="text-[20px] font-semibold leading-7">{thread.subject}</h1>
          {/* The add-in bar Outlook mobile shows under a message's subject */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-mail-muted">Apps</span>
            <button
              onClick={() => actions.toggleSidebar(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-mail-line bg-white px-3 text-small font-semibold text-mail-text shadow-card"
              data-tour="open-sidebar"
            >
              <SirionMark size={13} /> Sirion
            </button>
          </div>
        </div>
        {msgs.map((m) => {
          const open = m.id === openId;
          return (
            <article key={m.id} className="border-t border-mail-line">
              <button className="flex w-full items-start gap-3 px-4 py-3 text-left" onClick={() => actions.openMessage(m.id)} aria-expanded={open}>
                <Avatar person={m.from} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold">{m.from.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-mail-muted">{fmtDate(m.date, open)}</span>
                  </span>
                  <span className="block truncate text-xs text-mail-muted">{open ? `To: ${m.to.map((p) => p.name).join(", ")}` : m.body.replace(/\s+/g, " ").slice(0, 90)}</span>
                </span>
              </button>
              {open && (
                <div className="px-4 pb-4">
                  {(m.attachmentIds ?? []).map((aid) => {
                    const a = byId.get(aid)!;
                    const showing = source?.messageId === aid;
                    return (
                      <div key={aid} className="mb-3">
                        <button
                          onClick={() => actions.selectSource(showing ? m.id : aid)}
                          className="flex w-full items-center gap-3 rounded-[10px] border border-mail-line px-3 py-2.5 text-left"
                          data-tour="attachment"
                        >
                          <span className="inline-flex h-9 w-8 items-center justify-center rounded-[4px] text-[10px] font-bold text-white" style={{ background: "var(--avatar-3)" }} aria-hidden>
                            PDF
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-small font-semibold">{a.filename}</span>
                            <span className="block text-xs text-mail-muted">{showing ? "Tap to close" : "Tap to preview"}</span>
                          </span>
                        </button>
                        {showing && (
                          <div className="mt-2 whitespace-pre-wrap rounded-[8px] bg-mail-pane p-3 font-mono text-xs leading-5 fade-in" data-tour="pdf-preview">
                            <Highlighted text={a.body} quote={source?.quote} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="whitespace-pre-wrap text-[15px] leading-6">
                    <Highlighted text={m.body} quote={source?.messageId === m.id ? source.quote : undefined} />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <nav className="flex h-14 shrink-0 items-center justify-around border-t border-mail-line bg-white text-xs text-mail-blue" aria-hidden>
        <span className="flex items-center gap-1.5">
          <Reply size={18} strokeWidth={1.75} /> Reply
        </span>
        <span className="flex items-center gap-1.5">
          <ReplyAll size={18} strokeWidth={1.75} /> Reply all
        </span>
        <span className="flex items-center gap-1.5">
          <Forward size={18} strokeWidth={1.75} /> Forward
        </span>
      </nav>
    </>
  );
}
