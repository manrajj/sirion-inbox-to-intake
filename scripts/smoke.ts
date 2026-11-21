import { DEALS, EXAMPLES } from "../data/index";
import { deriveDeal, emptyDecisions } from "../src/lib/derive";
for (const d of DEALS) {
  const added = d.messages.filter(m => !(d.rival && m.from.email.endsWith(d.rival.domain))).map(m => ({ messageId: m.id, addedBy: "Sam", addedAt: "", via: "thread" as const }));
  const v = deriveDeal(d, EXAMPLES[d.id], added, emptyDecisions());
  console.log(`\n== ${d.id} route=${v.route?.ruleId} entityConflict=${!!v.entityConflict} repo=${v.repository.matches.length}/${v.repository.noMatch} susp=${v.suspicious.length}`);
  v.terms.forEach(t => console.log(`  ${t.key}: ${t.status} ${t.value ?? ""} ${t.heldBackReason ?? ""} ${t.claimNote ?? ""} [${t.checks.map(c=>c.pass===null?'-':c.pass?'y':'n').join("")}]`));
  v.core.forEach(c => console.log(`  core ${c.key}: ${c.value} (${c.source})`));
  v.chase.forEach(c => console.log(`  chase ${c.draft.termKey}: ok=${c.check.ok} ${c.check.reasons.join("; ")}`));
  console.log("  blockers:", v.blockers.filter(b=>b.kind!=='core-unconfirmed'&&b.kind!=='term-unconfirmed').map(b=>b.label).join(" | "));
}
