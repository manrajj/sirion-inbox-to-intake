import type { Deal, Person } from "../../src/lib/types";
import { SAM, PRIYA, LENA } from "./people";

const TOM: Person = { name: "Tom Ashby", email: "tom.ashby@brightline-analytics.example", role: "Account executive, Brightline" };
const GRACE: Person = { name: "Grace Lin", email: "grace.lin@brightline-analytics.example", role: "Deal desk, Brightline" };
const NINA: Person = { name: "Nina Vos", email: "nina.vos@corvex.example", role: "Sales, Corvex" };

export const DL1042: Deal = {
  id: "DL-1042",
  title: "Brightline marketing analytics subscription",
  category: "SaaS",
  demonstrates: "Main deal: a condition resolved, a conflict sent to Legal",
  supplier: { name: "Brightline Analytics", legalEntity: "Brightline Analytics Ltd", domain: "brightline-analytics.example" },
  rival: { name: "Corvex Data", domain: "corvex.example" },
  requester: PRIYA,
  owner: SAM,
  openMessageId: "bl-06",
  threads: [
    { id: "t-req", subject: "Request: marketing analytics platform", label: "Priya's request (internal)", messageIds: ["rq-01", "rq-02", "rq-03", "rq-04"] },
    { id: "t-bl", subject: "Brightline proposal for Halden", label: "Brightline negotiation", messageIds: ["bl-01", "bl-02", "bl-03", "bl-04", "bl-05", "bl-06", "pdf-q2291"] },
    { id: "t-fin", subject: "Budget check: Brightline analytics", label: "Finance budget check (internal)", messageIds: ["fn-01", "fn-02"] },
    { id: "t-cx", subject: "Corvex quote: analytics platform", label: "Corvex quote (rival)", messageIds: ["cx-01"] },
  ],
  // Manraj opened DL-1042 on 18 Nov, after picking Brightline, and added the two internal threads then.
  preAdded: ["rq-01", "rq-02", "rq-03", "rq-04", "fn-01", "fn-02"].map((messageId) => ({ messageId, addedBy: "Manraj Singh", addedAt: "2026-11-18T09:02:00Z" })),
  repository: {
    records: [
      { id: "MSA-2025-0187", type: "Master subscription agreement", entity: "Brightline Analytics Ltd", signed: "2025-03-14", expires: "2028-03-13" },
    ],
    coverage: "Mock repository: 1 Brightline record searched, filtered by your access.",
  },
  confidential: ["Corvex", "corvex", "41,000", "$41K", "budget ceiling", "MKT-4410", "$52,000"],
  otherDeals: [
    { id: "DL-1038", title: "Brightline data connector add-on (closed)", supplierDomain: "brightline-analytics.example" },
    { id: "DL-1047", title: "Survey tool renewal", supplierDomain: "pollwise.example" },
  ],
  messages: [
    // ---- Thread 1: Priya's request (internal)
    {
      id: "rq-01", threadId: "t-req", kind: "email", from: PRIYA, to: [SAM], date: "2026-11-02T08:40:00Z",
      subject: "Request: marketing analytics platform",
      body: `Hi Manraj,

Marketing Ops needs a campaign attribution and analytics platform for 25 users. We would like a 12-month subscription starting 1 December 2026.

It will connect to our CRM, so the supplier will process customer data (contact records and campaign responses).

We have shortlisted Brightline Analytics and Corvex Data. Budget is up to $52,000 a year.

Thanks,
Priya`,
    },
    {
      id: "rq-02", threadId: "t-req", kind: "email", from: SAM, to: [PRIYA], date: "2026-11-02T10:05:00Z",
      subject: "RE: Request: marketing analytics platform",
      body: `Thanks Priya. I'll get quotes from both and pick one.

Manraj`,
    },
    {
      id: "rq-03", threadId: "t-req", kind: "email", from: PRIYA, to: [SAM], date: "2026-11-18T08:15:00Z",
      subject: "RE: Request: marketing analytics platform",
      body: `Hi Manraj, any update? Campaign launch is 5 December, so we need the contract in place before then.

Priya`,
    },
    {
      id: "rq-04", threadId: "t-req", kind: "email", from: SAM, to: [PRIYA], date: "2026-11-18T09:00:00Z",
      subject: "RE: Request: marketing analytics platform",
      body: `Hi Priya,

We are going with Brightline. The deal is agreed by email. I have opened request DL-1042 in Sirion and will send it to Legal today.

Manraj`,
    },

    // ---- Thread 2: Brightline negotiation (supplier)
    {
      id: "bl-01", threadId: "t-bl", kind: "email", from: TOM, to: [SAM], date: "2026-11-04T14:20:00Z",
      subject: "Brightline proposal for Halden",
      body: `Hi Manraj,

Thanks for the time today. Our proposal for Halden Group: the Brightline Insights platform for 25 users at $48,000 a year, on a 12-month subscription.

Pricing includes a 6% annual uplift from year two and a one-time setup fee of $5,000.

Best,
Tom Ashby
Brightline Analytics Ltd`,
    },
    {
      id: "bl-02", threadId: "t-bl", kind: "email", from: SAM, to: [TOM], date: "2026-11-06T09:30:00Z",
      subject: "RE: Brightline proposal for Halden",
      body: `Hi Tom,

Thanks. The $48,000 a year works for us. 6% is above what we can accept on the uplift.

We also need Net 45 payment terms, and a service credit if uptime drops below 99.9%.

Regards,
Manraj Singh
Procurement, Halden Group`,
    },
    {
      id: "bl-03", threadId: "t-bl", kind: "email", from: TOM, to: [SAM], date: "2026-11-09T16:45:00Z",
      subject: "RE: Brightline proposal for Halden",
      body: `Manraj,

We can do 4%. On uptime, we will credit 5% of the monthly fee for each month uptime falls below 99.9%.

Tom`,
    },
    {
      id: "bl-04", threadId: "t-bl", kind: "email", from: SAM, to: [TOM], date: "2026-11-10T11:10:00Z",
      subject: "RE: Brightline proposal for Halden",
      body: `Tom,

OK on 4% if you drop the setup fee. The service credit as described works for us.

We would also like 20 hours of onboarding training included.

Manraj`,
    },
    {
      id: "bl-05", threadId: "t-bl", kind: "email", from: TOM, to: [SAM], date: "2026-11-11T10:02:00Z",
      subject: "RE: Brightline proposal for Halden",
      body: `Manraj, let me check the setup fee with our deal desk and come back to you by Friday.

Tom`,
    },
    {
      id: "bl-06", threadId: "t-bl", kind: "email", from: TOM, to: [SAM], date: "2026-11-13T15:30:00Z",
      subject: "RE: Brightline proposal for Halden",
      attachmentIds: ["pdf-q2291"],
      body: `Hi Manraj,

Confirmed: we will waive the $5,000 setup fee, and the annual uplift stays at 4%. Invoices will be payable Net 45, as you asked.

Our revised quote Q-BL-2291 rev B is attached. Grace from our deal desk will send the order form once your legal team is ready.

Best,
Tom`,
    },
    {
      id: "pdf-q2291", threadId: "t-bl", kind: "pdf", parentId: "bl-06", filename: "Brightline_Quote_Q-BL-2291_revB.pdf",
      from: GRACE, to: [SAM], date: "2026-11-13T15:30:00Z", subject: "Quote Q-BL-2291 rev B",
      body: `BRIGHTLINE ANALYTICS LTD
Quote Q-BL-2291, revision B
Prepared for: Halden Group
Date: 13 November 2026. Valid until 30 November 2026.

1. Subscription
Brightline Insights platform, 25 named users.
Annual subscription fee: $48,000.
Subscription term: 12 months from the start date.

2. Fees
Setup fee: waived.
Annual uplift: 4% on each anniversary.
Payment terms: Net 30 from invoice date.

3. Service levels
Uptime commitment: 99.9% monthly.
Service credit: 5% of the monthly fee for each month uptime falls below 99.9%.

4. Terms
This quote is governed by the Master Subscription Agreement between the parties, where one exists.`,
    },

    // ---- Thread 3: Finance budget check (internal)
    {
      id: "fn-01", threadId: "t-fin", kind: "email", from: SAM, to: [LENA], date: "2026-11-12T13:00:00Z",
      subject: "Budget check: Brightline analytics",
      body: `Hi Lena,

Can you confirm budget for the Brightline analytics platform at $48,000 a year? Corvex came in at $41,000 but failed our security review.

Manraj`,
    },
    {
      id: "fn-02", threadId: "t-fin", kind: "email", from: LENA, to: [SAM, PRIYA], date: "2026-11-12T17:20:00Z",
      subject: "RE: Budget check: Brightline analytics",
      body: `Manraj,

Budget confirmed. Please charge it to cost centre MKT-4410 (Marketing Operations). A start date of 1 December 2026 works for FY27 phasing.

Lena`,
    },

    // ---- Thread 4: Corvex quote (rival)
    {
      id: "cx-01", threadId: "t-cx", kind: "email", from: NINA, to: [SAM], date: "2026-11-05T12:00:00Z",
      subject: "Corvex quote: analytics platform",
      body: `Hi Manraj,

As discussed, Corvex Data Inc can offer our analytics suite for 25 users at $41,000 a year, Net 30, with a 5% annual uplift.

Kind regards,
Nina Vos
Corvex Data Inc`,
    },
  ],
};
