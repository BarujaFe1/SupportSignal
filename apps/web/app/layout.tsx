import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportSignal — Support Intelligence Layer",
  description:
    "Analytics and triage for small support ops: classify messages, measure SLA, score refund risk and surface root causes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
