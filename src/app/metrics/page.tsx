import { NarrativePage } from "@/components/narrative/Page";
import { Metrics } from "@/components/narrative/Metrics";

export const metadata = { title: "Metrics · Sirion Inbox-to-Intake" };

export default function Page() {
  return (
    <NarrativePage eyebrow="5 of 5 · Success metrics" title="One number for both sides of the handoff">
      <Metrics />
    </NarrativePage>
  );
}
