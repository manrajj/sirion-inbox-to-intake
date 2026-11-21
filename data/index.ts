import type { Deal } from "../src/lib/types";
import { ExampleOutput } from "../src/lib/schema";
import { DL1042 } from "./deals/dl-1042";
import { EXPLORATION_DEALS } from "./deals/exploration";
import ex1042 from "./ai-examples/DL-1042.json";
import ex1051 from "./ai-examples/DL-1051.json";
import ex1058 from "./ai-examples/DL-1058.json";
import ex1063 from "./ai-examples/DL-1063.json";
import ex1067 from "./ai-examples/DL-1067.json";
import ex1072 from "./ai-examples/DL-1072.json";
import ex1076 from "./ai-examples/DL-1076.json";
import ex1081 from "./ai-examples/DL-1081.json";
import ex1085 from "./ai-examples/DL-1085.json";

export const DEALS: Deal[] = [DL1042, ...EXPLORATION_DEALS];

const RAW: Record<string, unknown> = {
  "DL-1042": ex1042,
  "DL-1051": ex1051,
  "DL-1058": ex1058,
  "DL-1063": ex1063,
  "DL-1067": ex1067,
  "DL-1072": ex1072,
  "DL-1076": ex1076,
  "DL-1081": ex1081,
  "DL-1085": ex1085,
};

/** Parsed (and therefore schema-checked) example outputs, keyed by deal ID. */
export const EXAMPLES: Record<string, ExampleOutput> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, ExampleOutput.parse(v)]),
);

export const RAW_EXAMPLES = RAW;

export function getDeal(id: string): Deal {
  const d = DEALS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal ${id}`);
  return d;
}
