import { z } from "zod";

// "The contract the model must meet." Every example output in
// data/ai-examples/*.json is validated against this at build time and in tests.

export const StepRole = z.enum([
  "offer",
  "counter",
  "condition",
  "resolution",
  "acceptance",
  "withdrawal",
  "statement",
]);

export const Evidence = z.object({
  messageId: z.string().min(1),
  quote: z.string().min(3),
});

export const TermStep = z.object({
  role: StepRole,
  party: z.enum(["supplier", "buyer"]),
  value: z.string().min(1),
  messageId: z.string().min(1),
  quote: z.string().min(3),
  /** For a resolution step: the condition it resolves, by quote. */
  resolves: z.string().optional(),
});

export const FieldType = z.enum(["money", "percent", "days", "months", "text", "sla", "hours"]);

export const Term = z.object({
  key: z.string(),
  label: z.string(),
  group: z.enum(["commercial", "renewal"]),
  fieldType: FieldType,
  claimedStatus: z.enum([
    "proposed",
    "countered",
    "conditional",
    "accepted",
    "withdrawn",
    "notNegotiated",
  ]),
  claimedValue: z.string().nullable(),
  steps: z.array(TermStep),
  /** Who should own the term if it goes to Legal open. */
  openOwner: z.enum(["Supplier", "Procurement", "Legal"]),
  /** Present only on deliberately wrong outputs planted to prove the checks. */
  plantedFlaw: z.string().optional(),
});

export const CoreFieldKey = z.enum([
  "legalEntity",
  "scope",
  "value",
  "termStart",
  "requester",
  "costCentre",
  "dataAccess",
]);

export const CoreField = z.object({
  key: CoreFieldKey,
  value: z.string(),
  evidence: z.array(Evidence).min(1),
});

export const DealSuggestion = z.object({
  dealId: z.string(),
  confidence: z.number().min(0).max(1),
  reasons: z
    .array(
      z.object({
        type: z.enum(["supplier_domain", "quote_number", "people", "product"]),
        detail: z.string(),
      }),
    )
    .min(1),
});

export const ExampleOutput = z.object({
  dealId: z.string(),
  model: z.literal("example-output-v1"),
  dealMatch: z.object({ suggestions: z.array(DealSuggestion).max(3) }),
  coreFields: z.array(CoreField),
  terms: z.array(Term).min(1),
  contractType: z.object({ suggestion: z.string(), reason: z.string(), evidence: z.array(Evidence) }),
  chaseDrafts: z.array(
    z.object({
      termKey: z.string(),
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      sourceMessageIds: z.array(z.string()).min(1),
      plantedFlaw: z.string().optional(),
    }),
  ),
  flags: z.array(
    z.object({
      type: z.literal("suspicious_instruction"),
      messageId: z.string(),
      quote: z.string(),
      note: z.string(),
    }),
  ),
  entityMentions: z.array(z.object({ messageId: z.string(), quote: z.string(), entity: z.string() })),
});

export type ExampleOutput = z.infer<typeof ExampleOutput>;
export type TermOutput = z.infer<typeof Term>;
export type TermStepOutput = z.infer<typeof TermStep>;
export type CoreFieldOutput = z.infer<typeof CoreField>;
export type CoreFieldKeyT = z.infer<typeof CoreFieldKey>;
export type ChaseDraftOutput = ExampleOutput["chaseDrafts"][number];

/** Plain-text rendering of the schema for the "How it decides" drawer. */
export const SCHEMA_TEXT = `ExampleOutput {
  dealMatch.suggestions[≤3] { dealId, confidence 0..1,
    reasons[≥1] { type: supplier_domain | quote_number | people | product, detail } }
  coreFields[] { key: legalEntity | scope | value | termStart | requester
                     | costCentre | dataAccess,
                 value, evidence[≥1] { messageId, quote } }
  terms[≥1] { key, label, fieldType, claimedStatus, claimedValue,
    steps[] { role: offer | counter | condition | resolution
                    | acceptance | withdrawal | statement,
              party: supplier | buyer, value, messageId, quote } }
  contractType { suggestion, reason, evidence[] }
  chaseDrafts[] { termKey, to, subject, body, sourceMessageIds[≥1] }
  flags[] { type: suspicious_instruction, messageId, quote, note }
  entityMentions[] { messageId, quote, entity }
}`;
