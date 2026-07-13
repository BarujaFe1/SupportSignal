# SupportSignal — Handoff

**Branch:** `chore/portfolio-quality-pass`  
**Date:** 2026-07-13

## What was found

- Working lab demo (frontend-first) + FastAPI local API
- Thin portfolio scaffolding: no CI, weak upload error handling, monolithic UI, no web unit tests, docs incomplete for recruiters
- Lint was interactive (`next lint` without eslint config)
- Unused `lucide-react` dependency
- Dual Python/TS engines without frontend coverage
- UX gaps: loading skeleton, a11y captions/alerts, section nav

**Pre-pass score:** ~6.4/10 (see `docs/AUDIT_REPORT.md`)

## What was fixed / improved

- CSV upload → HTTP 400 mapping (empty / bad schema / parse errors) + tests
- CORS read from `CORS_ORIGINS`
- Vitest suite for browser engine (classify/SLA/risk/memo)
- ESLint flat config for Next
- CI workflow (API ruff+pytest, Web typecheck+test+lint+build)
- UI split into LabChrome / RefundRiskTable; skeletons; skip link; section nav; chart a11y text
- Removed unused lucide dependency
- Hardened `.gitignore` for `.vercel/`
- Docs: AUDIT, ARCHITECTURE, TECHNICAL_DECISIONS, TESTING, DEPLOYMENT, SECURITY_NOTES, HANDOFF
- README rewritten as portfolio piece (problem/solution/demo/trade-offs/interview script)

## Commands run

```bash
# API
cd apps/api
pytest -q
ruff check app tests

# Web
cd apps/web
npm install
npm run typecheck
npm test
npm run lint
npm run build
```

## Tests executed

- API: health/demo/analyze/report/methodology + SLA + upload validations
- Web: vitest engine tests + typecheck + build

## What still remains

- Exact Python↔TS golden-fixture parity job in CI
- Real product screenshots (current assets are generated placeholders)
- Auth, connectors, billing (intentionally out of lab scope)
- Portfolio site redeploy may be rate-limited on free Vercel plan
- Optional mypy strictness not enabled (kept CI light)

## Remaining risks

- Dual-engine drift over time
- Keyword classifier misses paraphrases / multilingual edge cases
- Public demo has no auth (acceptable for lab; not for production data)

## Next steps

1. Merge `chore/portfolio-quality-pass` after CI green
2. Redeploy Vercel lab if UI changes need production refresh
3. Optionally add shared golden fixtures for parity
4. Replace placeholder screenshots with real cockpit captures

## Portfolio suggestions

- Keep Live Demo link first in README and GitHub homepage
- In interviews, lead with **refund risk drivers** + **human review**
- Pair with DecisionLab/FilaViva as “labs of operational judgment”

## Suggested commit message

```text
chore: improve portfolio quality, docs, tests and stability
```
