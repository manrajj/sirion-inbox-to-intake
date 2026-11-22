import type { Metadata } from "next";
import { AboutPage } from "@/components/product/About";

export const metadata: Metadata = { title: "About this prototype · Sirion intake from Outlook" };

export default function Page() {
  return <AboutPage />;
}
