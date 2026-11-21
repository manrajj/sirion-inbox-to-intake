// Core domain types for the Inbox-to-Intake prototype.

export type Party = "supplier" | "buyer";

export interface Person {
  name: string;
  email: string;
  role?: string;
}

export interface Message {
  id: string;
  threadId: string;
  kind: "email" | "pdf";
  from: Person;
  to: Person[];
  date: string; // ISO
  subject: string;
  body: string;
  /** For emails: ids of attached pdf messages. */
  attachmentIds?: string[];
  /** For pdfs: file name shown in the mail client. */
  filename?: string;
  /** For pdfs: the email that carried this attachment. */
  parentId?: string;
  /** False for files the product cannot read (scanned PDF, Excel). */
  readable?: boolean;
  unreadableReason?: string;
}

export interface Thread {
  id: string;
  subject: string;
  messageIds: string[];
  /** Short label for the @ picker. */
  label: string;
}

export interface RepositoryRecord {
  id: string;
  type: string;
  entity: string;
  signed: string;
  expires: string;
  restricted?: boolean;
}

export interface Deal {
  id: string;
  title: string;
  category: "SaaS" | "Staffing" | "Consulting" | "Marketing" | "Facilities";
  /** What this deal demonstrates, shown in the deal switcher. */
  demonstrates: string;
  explorationIndex?: number;
  supplier: { name: string; legalEntity: string; domain: string };
  rival?: { name: string; domain: string };
  requester: Person;
  owner: Person;
  /** The email open in the mock inbox when the deal loads. */
  openMessageId: string;
  /** If true, the sidebar opens with no deal picked. */
  startsWithoutDeal?: boolean;
  threads: Thread[];
  messages: Message[];
  /** Items already added to the deal before the owner opens it (e.g. by the requester). */
  preAdded: { messageId: string; addedBy: string; addedAt: string }[];
  repository: { records: RepositoryRecord[]; coverage: string };
  /** Tokens that must never reach a supplier: rival names, rival prices, internal limits. */
  confidential: string[];
  /** Values already on the Sirion draft request (set when the deal ID was created). */
  draftFields?: Partial<Record<"requester" | "costCentre" | "value" | "termStart", string>>;
  /** Other draft deals the owner is on, for the deal picker and suggestions. */
  otherDeals?: { id: string; title: string; supplierDomain: string; quoteNumbers?: string[] }[];
}

// ---------- Owner decisions (UI state) ----------

export type Resolution =
  | { type: "picked"; value: string; messageId: string }
  | { type: "open"; reason: string; owner: string }
  | { type: "offEmail"; value: string; note: string };

export interface AddedItem {
  messageId: string;
  addedBy: string;
  addedAt: string;
  via: "pre-added" | "this-email" | "thread" | "attachment" | "@";
  removed?: boolean;
}

export type DisplayStatus =
  | "accepted"
  | "conditional"
  | "proposed"
  | "countered"
  | "withdrawn"
  | "offEmail"
  | "notNegotiated"
  | "conflict"
  | "openForLegal"
  | "heldBack";
