# SupportSignal — Architecture

## Purpose

SupportSignal is a **support intelligence lab**: classify synthetic support messages, measure first-response SLA, score refund risk with explainable drivers, explore root-cause themes, and emit a weekly memo + action backlog.

It is intentionally **not** a helpdesk and **not** an autonomous “AI that resolves support”.

## Runtime surfaces

```text
Public demo (Vercel)
  apps/web  → browser engine (lib/engine) + public seed JSON

Local dual mode
  apps/web  → Next.js lab UI
  apps/api  → FastAPI classification / upload / methodology
```

## Folder map

```text
SupportSignal/
├── apps/web/                 # Next.js 15 lab (deploy target)
│   ├── app/                  # UI routes
│   ├── components/           # Lab chrome, chart, risk table
│   ├── lib/engine/           # Heuristic classifier (frontend-first)
│   └── public/data/          # Synthetic seed JSON
├── apps/api/                 # FastAPI reference API
│   ├── app/api/              # REST routers
│   ├── app/services/         # Python analyzer / report / demo loader
│   └── tests/
├── data/seed/                # Canonical CSV seed
├── docs/                     # Audit, architecture, testing, handoff
└── scripts/                  # Asset + seed generator
```

## Domain pipeline

```text
Raw messages (CSV / demo JSON)
  → normalize channels & timestamps
  → category classification (keyword rules)
  → sentiment + urgency heuristics
  → SLA first-response hours + breach flags
  → refund risk score (0–100) + drivers
  → topic aggregation + emerging themes
  → weekly memo + prioritized actions
```

## Dual-engine contract

Python (`apps/api/app/services/analyzer.py`) and TypeScript (`apps/web/lib/engine/analyzer.ts`) implement the **same heuristic contract** for the lab:

- shared category dictionaries and risk additives;
- SLA targets: 4h (high urgency) / 24h (otherwise);
- open + no first response ⇒ breach;
- emails masked in previews.

Drift risk is real; CI covers each side separately. Future improvement: golden fixtures shared across both engines.

## Privacy defaults

- Demo seed is synthetic.
- Previews mask emails (`c***@example.com`).
- Uploads stay local (`data/uploads/` ignored).
- No production mailbox sync in MVP.
