import { NarrativePage } from "@/components/narrative/Page";
import { StakeholderMap } from "@/components/narrative/StakeholderMap";

export const metadata = { title: "Stakeholders · Sirion Inbox-to-Intake" };

export default function Page() {
  return (
    <NarrativePage eyebrow="2 of 5 · Stakeholder map" title="Built for the owner, trusted by Legal and IT" next={{ href: "/problem/", label: "Problem" }}>
      <StakeholderMap />
    </NarrativePage>
  );
}
