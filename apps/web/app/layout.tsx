import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportSignal Lab — Support Intelligence Demo",
  description:
    "Portfolio lab: classify synthetic support messages, measure SLA, score refund risk and surface root-cause actions. Heuristic intelligence layer — not a full helpdesk.",
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
