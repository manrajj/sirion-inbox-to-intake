"use client";

import { useEffect, useState } from "react";
import {
  Info,
  Grip,
  Play,
  RotateCcw,
  CalendarDays,
  SquareCheckBig,
  Cloud,
  Search,
  Bell,
  Settings,
  Mail,
  Users,
  LayoutGrid,
  SquarePen,
  Trash,
  Archive,
  ShieldAlert,
  FolderInput,
  Reply,
  ReplyAll,
  Forward,
  Flag,
  MailOpen,
  Ellipsis,
  ChevronDown,
  Inbox,
  Send,
  FileEdit,
  Paperclip,
  ListFilter,
  StickyNote,
} from "lucide-react";
import { actions, useApp, threadOf } from "@/lib/store";
import { getDeal } from "@data/index";
import { BUYER_DOMAIN, domainOf } from "@/lib/checks";
import { cx, fmtDate } from "@/components/ui";
import type { Person } from "@/lib/types";
import { Highlighted } from "./SourceText";
import { Sidebar } from "./Sidebar";
import { SirionLogo, SirionMark } from "./SirionMark";
import { startFilm } from "@/components/walkthrough/Film";
import { AboutButton } from "./About";

// A mock of a web mail client in the Outlook layout: top bar, app rail, command bar,
// folder pane, message list, reading pane and the add-in pane on the right.
// It uses its own Fluent-style neutrals and blue (mail-* tokens) so the Sirion pane,
// in Sirion's teal, reads as an add-in inside someone else's app. The org logo slot
// shows Sirion's logo, as a company's own Outlook would (DECISIONS C7).

const AVATARS = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
];

function initials(name: string) {
  const parts = name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export function Avatar({ person, size = 32 }: { person: Person; size?: number }) {
  let h = 0;
  for (const c of person.email) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: AVATARS[h % AVATARS.length],
        fontSize: size * 0.38,
      }}
      aria-hidden
    >
      {initials(person.name)}
    </span>
  );
}

const RAIL: { icon: React.ElementType; cls: string; letter?: string }[] = [
  { icon: Mail, cls: "text-mail-blue" },
  { icon: CalendarDays, cls: "text-mail-calendar" },
  { icon: Users, cls: "text-mail-people" },
  { icon: SquareCheckBig, cls: "text-mail-todo" },
  { icon: Cloud, cls: "text-mail-onedrive" },
  { icon: Mail, cls: "bg-mail-word", letter: "W" },
  { icon: Mail, cls: "bg-mail-excel", letter: "X" },
  { icon: LayoutGrid, cls: "text-mail-muted" },
];

function IconBtn({
  icon: I,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-small text-mail-text",
        className,
      )}
      aria-hidden
      title={label}
    >
      <I size={16} strokeWidth={1.5} className="text-mail-blue" />
      <span className="hidden 2xl:inline">{label}</span>
    </span>
  );
}

export function MailClient() {
  const dealId = useApp((s) => s.dealId);
  const openId = useApp((s) => s.openMessageId);
  const sidebarOpen = useApp((s) => s.sidebarOpen);
  const source = useApp((s) => s.source);
  const deal = getDeal(dealId);
  const byId = new Map(deal.messages.map((m) => [m.id, m]));
  const openThread = threadOf(deal, openId);
  const [seen, setSeen] = useState<Set<string>>(() => new Set([openThread.id]));
  useEffect(
    () =>
      setSeen((s) =>
        s.has(openThread.id) ? s : new Set(s).add(openThread.id),
      ),
    [openThread.id],
  );
  useEffect(() => setSeen(new Set([openThread.id])), [dealId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = deal.threads
    .map((t) => {
      const emails = t.messageIds
        .map((id) => byId.get(id)!)
        .filter((m) => m.kind === "email");
      const latest = emails[emails.length - 1];
      const fromOutside = domainOf(latest.from.email) !== BUYER_DOMAIN;
      return {
        t,
        latest,
        count: emails.length,
        hasAttachment: t.messageIds.some((id) => byId.get(id)!.kind === "pdf"),
        unread: fromOutside && !seen.has(t.id),
      };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
  const unreadCount = rows.filter((r) => r.unread).length;
  const threadMsgs = openThread.messageIds
    .map((id) => byId.get(id)!)
    .filter((m) => m.kind === "email");
  const me = { name: "Manraj Singh", email: `manraj.singh@${BUYER_DOMAIN}` };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-mail-bg text-mail-text"
      data-tour="inbox"
    >
      {/* Top bar, as Outlook on the web shows it: app launcher, the organisation's logo, "Outlook", search */}
      <header className="flex h-12 shrink-0 items-center gap-3 bg-mail-bg pl-3 pr-2">
        <Grip
          size={20}
          strokeWidth={2.25}
          aria-hidden
          className="hidden text-mail-text sm:block"
        />
        <span className="flex items-center gap-3 pl-1" aria-label="Organisation: Sirion">
          <SirionLogo size={18} />
          <span className="hidden text-[16px] font-medium text-mail-text sm:inline">Outlook</span>
        </span>
        <div className="hidden h-8 w-full max-w-[380px] items-center gap-2 rounded-[6px] border border-mail-line bg-white px-2.5 text-small text-mail-muted md:flex lg:ml-6">
          <Search size={16} strokeWidth={1.75} className="text-mail-text" aria-hidden />
          <span>Search</span>
        </div>
        <span className="ml-auto flex items-center gap-1">
          <AboutButton />
          <button
            onClick={() => startFilm(0)}
            className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-button bg-amethyst px-3 text-small text-white hover:bg-amethyst-hover"
            data-tour="watch"
          >
            <Play size={14} strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">Watch walkthrough</span>
            <span className="sm:hidden">Watch</span>
          </button>
          <button
            onClick={() => actions.resetDeal()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-button text-mail-text hover:bg-white"
            aria-label="Start again"
            title="Start again"
          >
            <RotateCcw size={16} strokeWidth={1.75} />
          </button>
          <Bell size={17} strokeWidth={1.5} className="ml-1 hidden text-mail-text sm:block" aria-hidden />
          <Settings size={17} strokeWidth={1.5} className="ml-2 hidden text-mail-text sm:block" aria-hidden />
          <span className="ml-2 hidden sm:inline-flex">
            <Avatar person={me} size={28} />
          </span>
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* App rail with the Microsoft 365 apps */}
        <nav
          className="hidden w-12 shrink-0 flex-col items-center gap-1.5 py-1 md:flex"
          aria-hidden
        >
          {RAIL.map(({ icon: I, cls, letter }, i) => (
            <span
              key={i}
              className={cx(
                "relative inline-flex h-10 w-10 items-center justify-center rounded-[6px]",
                i === 0 && "bg-white shadow-card",
              )}
            >
              {i === 0 && (
                <span className="absolute -left-1 top-2.5 h-5 w-[3px] rounded-r bg-mail-blue" />
              )}
              {letter ? (
                <span className={cx("inline-flex h-[20px] w-[20px] items-center justify-center rounded-[4px] text-[11px] font-semibold text-white", cls)}>
                  {letter}
                </span>
              ) : (
                <I size={21} strokeWidth={1.75} className={cls} />
              )}
            </span>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-2 py-2 pr-2 md:pl-0 pl-2">
          {/* Ribbon: tabs and command bar */}
          <div className="shrink-0 rounded-[8px] bg-white shadow-card">
            <div
              className="hidden items-center gap-5 px-3 pt-1.5 text-small md:flex"
              aria-hidden
            >
              {["Home", "View", "Help"].map((t, i) => (
                <span
                  key={t}
                  className={cx(
                    "pb-1",
                    i === 0
                      ? "border-b-2 border-mail-blue font-semibold text-mail-text"
                      : "text-mail-muted",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 overflow-hidden px-2 py-1.5">
              <span
                className="hidden h-8 items-center gap-1.5 rounded-[4px] bg-mail-blue px-3 text-small font-semibold text-white sm:inline-flex"
                aria-hidden
              >
                <SquarePen size={15} strokeWidth={1.75} /> New mail
                <ChevronDown size={14} strokeWidth={1.75} />
              </span>
              <span className="mx-1 hidden h-5 w-px bg-mail-line sm:block" />
              <span className="hidden items-center sm:flex">
                <IconBtn icon={Trash} label="Delete" />
                <IconBtn icon={Archive} label="Archive" />
                <IconBtn
                  icon={ShieldAlert}
                  label="Report"
                  className="hidden xl:inline-flex"
                />
                <IconBtn
                  icon={FolderInput}
                  label="Move to"
                  className="hidden xl:inline-flex"
                />
                <span className="mx-1 h-5 w-px bg-mail-line" />
                <IconBtn icon={Reply} label="Reply" />
                <IconBtn
                  icon={ReplyAll}
                  label="Reply all"
                  className="hidden lg:inline-flex"
                />
                <IconBtn
                  icon={Forward}
                  label="Forward"
                  className="hidden lg:inline-flex"
                />
                <span className="mx-1 hidden h-5 w-px bg-mail-line lg:block" />
                <IconBtn
                  icon={MailOpen}
                  label="Read / Unread"
                  className="hidden xl:inline-flex"
                />
                <IconBtn
                  icon={Flag}
                  label="Flag"
                  className="hidden lg:inline-flex"
                />
                <IconBtn icon={Ellipsis} label="More" />
              </span>
              <span className="ml-auto flex items-center gap-1">
                <span className="hidden text-xs text-mail-muted xl:inline">
                  Apps
                </span>
                <button
                  data-tour="open-sidebar"
                  onClick={() => actions.toggleSidebar()}
                  aria-pressed={sidebarOpen}
                  className={cx(
                    "inline-flex min-h-11 items-center gap-2 rounded-[6px] border px-3 text-small font-semibold",
                    sidebarOpen
                      ? "border-teal bg-tone-success-bg text-teal"
                      : "border-mail-line bg-white text-mail-text hover:bg-mail-blue-soft",
                  )}
                >
                  <SirionMark size={12} />
                  Sirion
                </button>
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-2">
            {/* Folder pane */}
            <aside
              className={cx(
                "thin-scroll w-[196px] shrink-0 flex-col overflow-y-auto py-1 text-small",
                sidebarOpen ? "hidden 2xl:flex" : "hidden xl:flex",
              )}
              aria-label="Folders"
            >
              <FolderGroup title="Favorites">
                <Folder icon={Inbox} label="Inbox" n={unreadCount} active />
                <Folder icon={Send} label="Sent Items" />
                <Folder icon={FileEdit} label="Drafts" n={1} muted />
              </FolderGroup>
              <FolderGroup title={me.email}>
                <Folder icon={Inbox} label="Inbox" n={unreadCount} />
                <Folder icon={FileEdit} label="Drafts" n={1} muted />
                <Folder icon={Send} label="Sent Items" />
                <Folder icon={Trash} label="Deleted Items" />
                <Folder icon={Archive} label="Archive" />
                <Folder icon={StickyNote} label="Notes" />
              </FolderGroup>
            </aside>

            {/* Message list */}
            <section
              className="hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-[8px] bg-white shadow-card md:flex"
              aria-label="Messages"
            >
              <div className="flex items-center justify-between px-3 pt-2.5">
                <span className="flex items-center gap-1 text-[15px] font-semibold">
                  Inbox
                </span>
                <ListFilter
                  size={16}
                  strokeWidth={1.5}
                  className="text-mail-muted"
                  aria-hidden
                />
              </div>
              <div
                className="flex gap-4 border-b border-mail-line px-3 text-small"
                aria-hidden
              >
                <span className="border-b-2 border-mail-blue py-1.5 font-semibold">
                  Focused
                </span>
                <span className="py-1.5 text-mail-muted">Other</span>
              </div>
              <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto">
                {rows.map(({ t, latest, count, hasAttachment, unread }) => {
                  const active = t.id === openThread.id;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => actions.openMessage(latest.id)}
                        data-tour={`thread-${t.id}`}
                        className={cx(
                          "relative flex w-full gap-2.5 border-b border-mail-line px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-mail-selected"
                            : "hover:bg-mail-blue-soft",
                        )}
                        aria-current={active ? "true" : undefined}
                      >
                        {unread && (
                          <span
                            className="absolute left-0 top-0 h-full w-[3px] bg-mail-blue"
                            aria-hidden
                          />
                        )}
                        <Avatar person={latest.from} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cx(
                                "truncate text-small",
                                unread && "font-semibold",
                              )}
                            >
                              {latest.from.name}
                            </span>
                            <span
                              className={cx(
                                "shrink-0 text-xs",
                                unread
                                  ? "font-semibold text-mail-blue"
                                  : "text-mail-muted",
                              )}
                            >
                              {fmtDate(latest.date)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-small">
                            <span
                              className={cx(
                                "truncate",
                                unread
                                  ? "font-semibold text-mail-blue"
                                  : "text-mail-text",
                              )}
                            >
                              {t.subject}
                            </span>
                            {count > 1 && (
                              <span className="shrink-0 text-xs text-mail-muted">
                                ({count})
                              </span>
                            )}
                            {hasAttachment && (
                              <Paperclip
                                size={13}
                                strokeWidth={1.75}
                                className="ml-auto shrink-0 text-mail-muted"
                                aria-label="Has attachment"
                              />
                            )}
                          </span>
                          <span className="block truncate text-xs text-mail-muted">
                            {latest.body.replace(/\s+/g, " ").slice(0, 90)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Reading pane */}
            <section
              className={cx(
                "min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-white shadow-card",
                sidebarOpen ? "hidden md:flex" : "flex",
              )}
              aria-label="Reading pane"
            >
              <label className="border-b border-mail-line px-4 py-2 md:hidden">
                <span className="sr-only">Choose a conversation</span>
                <select
                  value={openThread.id}
                  onChange={(e) => {
                    const r = rows.find((x) => x.t.id === e.target.value);
                    if (r) actions.openMessage(r.latest.id);
                  }}
                  className="min-h-11 w-full rounded-[4px] border border-mail-line bg-white px-2 text-small text-mail-text"
                >
                  {rows.map(({ t, latest }) => (
                    <option key={t.id} value={t.id}>
                      {latest.from.name}: {t.subject}
                    </option>
                  ))}
                </select>
              </label>
              <div className="px-5 pb-2 pt-4">
                <h2 className="text-[20px] font-semibold leading-7 text-mail-text">
                  {openThread.subject}
                </h2>
                <p className="text-xs text-mail-muted">
                  {threadMsgs.length} message{threadMsgs.length > 1 ? "s" : ""}{" "}
                  in this conversation
                </p>
              </div>
              <InboxContext className="mx-3 mb-2" />
              <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-3">
                {threadMsgs.map((m) => {
                  const isOpen = m.id === openId;
                  return (
                    <article
                      key={m.id}
                      className={cx(
                        "mb-2 rounded-[8px] border",
                        isOpen
                          ? "border-mail-line bg-white shadow-card"
                          : "border-transparent bg-mail-pane hover:bg-mail-blue-soft",
                      )}
                    >
                      <button
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
                        onClick={() => actions.openMessage(m.id)}
                        aria-expanded={isOpen}
                      >
                        <Avatar person={m.from} size={isOpen ? 36 : 28} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-small font-semibold text-mail-text">
                              {m.from.name}{" "}
                              <span className="font-normal text-mail-muted">
                                &lt;{m.from.email}&gt;
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-mail-muted">
                              {fmtDate(m.date, true)}
                            </span>
                          </span>
                          {isOpen ? (
                            <span className="block truncate text-xs text-mail-muted">
                              To: {m.to.map((p) => p.name).join("; ")}
                            </span>
                          ) : (
                            <span className="block truncate text-xs text-mail-muted">
                              {m.body.replace(/\s+/g, " ").slice(0, 120)}
                            </span>
                          )}
                        </span>
                        {isOpen && (
                          <span
                            className="hidden shrink-0 items-center gap-0.5 text-mail-blue lg:flex"
                            aria-hidden
                          >
                            <Reply
                              size={16}
                              strokeWidth={1.5}
                              className="m-1"
                            />
                            <ReplyAll
                              size={16}
                              strokeWidth={1.5}
                              className="m-1"
                            />
                            <Forward
                              size={16}
                              strokeWidth={1.5}
                              className="m-1"
                            />
                            <Ellipsis
                              size={16}
                              strokeWidth={1.5}
                              className="m-1 text-mail-muted"
                            />
                          </span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="pb-4 pl-[60px] pr-4">
                          {(m.attachmentIds ?? []).map((aid) => {
                            const a = byId.get(aid)!;
                            return (
                              <button
                                key={aid}
                                onClick={() => actions.selectSource(aid)}
                                className="mb-3 mr-2 inline-flex items-center gap-2.5 rounded-[6px] border border-mail-line bg-white px-3 py-2 text-left text-xs text-mail-text shadow-card hover:bg-mail-blue-soft"
                                data-tour="attachment"
                              >
                                <span
                                  className="inline-flex h-7 w-6 items-center justify-center rounded-[3px] text-[9px] font-bold text-white"
                                  style={{ background: "var(--avatar-3)" }}
                                  aria-hidden
                                >
                                  PDF
                                </span>
                                <span>
                                  <span className="block font-semibold">
                                    {a.filename}
                                  </span>
                                  <span className="block text-mail-muted">
                                    Click to preview
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                          {source && (m.attachmentIds ?? []).includes(source.messageId) && (
                            <div className="mb-3 rounded-[6px] border border-mail-line bg-mail-pane p-3 fade-in" data-tour="pdf-preview">
                              <div className="mb-1 flex items-center justify-between text-xs text-mail-muted">
                                <span>{byId.get(source.messageId)!.filename}</span>
                                <button onClick={() => actions.selectSource(m.id)} className="min-h-8 px-2 text-mail-blue hover:underline">
                                  Close preview
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap font-mono text-xs leading-5 text-mail-text">
                                <Highlighted text={byId.get(source.messageId)!.body} quote={source.quote} />
                              </div>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-[14px] leading-6 text-mail-text">
                            <Highlighted text={m.body} quote={source?.messageId === m.id ? source.quote : undefined} />
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {sidebarOpen && <Sidebar />}
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-1 truncate px-2 py-1.5 text-small font-semibold text-mail-text"
        aria-hidden
      >
        <ChevronDown size={14} strokeWidth={1.75} className="shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <ul aria-hidden>{children}</ul>
    </div>
  );
}

function Folder({
  icon: I,
  label,
  n,
  active,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  n?: number;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <li
      className={cx(
        "relative flex h-8 items-center gap-2 rounded-[4px] pl-6 pr-2",
        active ? "bg-mail-selected font-semibold" : "",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 h-5 w-[3px] rounded-r bg-mail-blue" />
      )}
      <I size={16} strokeWidth={1.5} className="shrink-0 text-mail-muted" />
      <span className="flex-1 truncate">{label}</span>
      {n ? (
        <span
          className={cx(
            "text-xs",
            muted ? "text-mail-muted" : "font-semibold text-mail-blue",
          )}
        >
          {n}
        </span>
      ) : null}
    </li>
  );
}

export const INBOX_CONTEXT = "Manraj's inbox (Procurement Contract Manager). The Brightline deal was agreed in these emails.";

/** A quiet line that tells a first-time viewer whose inbox this is, before they open the add-in. */
export function InboxContext({ className, compact }: { className?: string; compact?: boolean }) {
  const seen = useApp((s) => !!s.addinSeen);
  if (seen) return null;
  return (
    <div className={className} data-tour="inbox-context">
      <p className={cx("flex w-full items-start gap-2.5 rounded-[10px] bg-amethyst font-medium text-white shadow-pop", compact ? "px-3 py-2.5 text-small leading-5" : "px-4 py-3 text-[15px] leading-6")}>
        <Info size={18} strokeWidth={2} className={cx("shrink-0 text-white", compact ? "mt-[1px]" : "mt-[3px]")} aria-hidden />
        <span>{INBOX_CONTEXT}</span>
      </p>
    </div>
  );
}
