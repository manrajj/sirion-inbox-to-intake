// Build-time gate: every example output must meet the model contract (Zod schema),
// and every cited message ID must exist in its deal.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ExampleOutput } from "../src/lib/schema";
import { DEALS } from "../data/index";

const dir = path.join(__dirname, "..", "data", "ai-examples");
let failed = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const res = ExampleOutput.safeParse(raw);
  if (!res.success) {
    failed++;
    console.error(`✗ ${f}: ${res.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    continue;
  }
  const deal = DEALS.find((d) => d.id === res.data.dealId);
  if (!deal) { failed++; console.error(`✗ ${f}: no deal ${res.data.dealId}`); continue; }
  const ids = new Set(deal.messages.map((m) => m.id));
  const refs = [
    ...res.data.coreFields.flatMap((c) => c.evidence.map((e) => e.messageId)),
    ...res.data.terms.flatMap((t) => t.steps.map((s) => s.messageId)),
    ...res.data.chaseDrafts.flatMap((c) => c.sourceMessageIds),
    ...res.data.flags.map((x) => x.messageId),
    ...res.data.entityMentions.map((x) => x.messageId),
  ];
  const bad = refs.filter((r) => !ids.has(r));
  if (bad.length) { failed++; console.error(`✗ ${f}: unknown message IDs ${bad.join(", ")}`); continue; }
  console.log(`✓ ${f}`);
}
if (failed) { console.error(`${failed} example file(s) failed the model contract`); process.exit(1); }
