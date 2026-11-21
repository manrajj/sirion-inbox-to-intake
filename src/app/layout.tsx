import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-inter-tight", display: "swap" });

export const metadata: Metadata = {
  title: "Sirion Inbox-to-Intake: a prototype",
  description: "Turn a supplier deal agreed over email into a cited, Legal-ready Sirion intake request. A candidate prototype for the Sirion APM case.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
