import type { ReactNode } from "react";

export function LabBanner() {
  return (
    <div className="lab-banner" role="note" aria-label="Lab scope notice">
      <strong>Lab demo</strong> — classificação heurística + SLA + risco de reembolso em
      inbox sintética. Camada de inteligência operacional; <em>não</em> é helpdesk nem
      “IA que resolve suporte” sozinha. Alto risco exige revisão humana.
    </div>
  );
}

export function TopBar() {
  return (
    <header className="topbar">
      <div>
        <p className="muted" style={{ margin: 0 }}>
          SupportSignal · portfolio lab
        </p>
      </div>
      <nav className="topnav" aria-label="Project links">
        <a href="https://barujafe.vercel.app">← Portfólio</a>
        <a
          href="https://github.com/BarujaFe1/SupportSignal"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}

export function SectionNav() {
  const links = [
    { href: "#inbox", label: "Inbox" },
    { href: "#sla", label: "SLA" },
    { href: "#topics", label: "Topics" },
    { href: "#refund-risk", label: "Refund risk" },
    { href: "#root-cause", label: "Root cause" },
    { href: "#memo", label: "Memo" },
    { href: "#actions", label: "Actions" },
  ];
  return (
    <nav className="section-nav" aria-label="Cockpit sections">
      {links.map((l) => (
        <a key={l.href} href={l.href}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

export function Panel({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-live="polite">
      <div className="skeleton-row" />
      <div className="skeleton-row short" />
      <div className="skeleton-row" />
      <p className="muted">Analisando inbox sintética…</p>
    </div>
  );
}
