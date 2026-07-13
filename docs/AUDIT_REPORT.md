# SupportSignal — Audit Report

**Branch:** `chore/portfolio-quality-pass`  
**Date:** 2026-07-13  
**Auditor role:** senior full-stack + QA + portfolio recruiter lens

---

## 1. Executive summary

SupportSignal is a **portfolio lab** (not a production helpdesk) that classifies a synthetic support inbox, measures first-response SLA, scores refund risk with explainable drivers, and produces a weekly memo + action backlog.

The public demo is **frontend-first** on Vercel (`supportsignal-lab.vercel.app`). FastAPI remains for local/API workflows. Positioning is correct (intelligence layer + human review), but the repo still reads partly like a scaffold: thin docs, no CI, upload path without HTTP error mapping, monolithic UI page, no frontend engine tests, and weak empty/loading/a11y states.

**Current portfolio score: 6.4 / 10**

After this quality pass target: **8.3–8.6 / 10** (solid lab demo with tests, CI, docs, clearer UX narrative).

---

## 2. Stack & structure (verified)

| Layer | Reality |
|---|---|
| Web | Next.js 15 App Router, React 19, TypeScript, Recharts |
| Lab engine | `apps/web/lib/engine/*` (browser heuristics) |
| API | FastAPI + Pandas + Pydantic (`apps/api`) |
| Seed | CSV + JSON (`data/seed`, `apps/web/public/data`) |
| Deploy | Vercel (`apps/web/vercel.json`), homepage set |
| Tests | API pytest only (6 tests); no web unit tests |
| CI | Missing |
| Docs | pitch/roadmap/methodology only |

---

## 3. Main risks

1. **Overclaim risk** if README/UI drift toward “AI support agent” language — must stay heuristic + human-in-the-loop.
2. **CSV upload 500s** — `analyze_uploaded_csv` raises `ValueError` / pandas errors without FastAPI HTTPException mapping.
3. **Dual engines (Python ↔ TS)** can drift without parity checks.
4. **No CI** — regressions can land unnoticed.
5. **Secrets hygiene** — local `.env.local` / `.vercel` must stay ignored (already mostly covered; harden root `.gitignore`).
6. **UX emptiness** — before analysis completes, sections look broken rather than loading.

---

## 4. Bugs / defects found

| ID | Severity | Issue |
|---|---|---|
| B1 | High | `/api/analyze/upload` lacks exception → HTTP mapping (500 on bad CSV) |
| B2 | Medium | Dead/unused path: Pydantic response models not wired; schemas underused |
| B3 | Medium | No frontend tests for classifier/SLA/risk core |
| B4 | Medium | Monolithic `page.tsx` hurts maintainability and a11y iteration |
| B5 | Low | `lucide-react` dependency unused |
| B6 | Low | Chart lacks accessible text alternative |
| B7 | Low | Error notice missing `role="alert"` |
| B8 | Low | Loading state only disables button; panels lack skeleton |
| B9 | Info | `next lint` may need eslint config on fresh CI |
| B10 | Info | FastAPI CORS hard-coded; `.env.example` CORS unused |

---

## 5. Quick wins

- Map CSV upload errors to `400` with clear message + tests.
- Add `vitest` (or lightweight node) tests for TS engine.
- Add GitHub Actions CI (web typecheck/build + api ruff/pytest).
- Lab loading skeleton + alert roles + table captions.
- Strengthen `.gitignore` for `.vercel/`.
- Portfolio-grade README + architecture/testing/deployment docs.
- Anchor nav to cockpit sections (SLA, risk, memo).

---

## 6. Structural improvements

- Keep dual engines but document parity contract + shared fixtures.
- Split UI into `LabBanner`, `KpiGrid`, `RefundRiskTable`, `ActionList`.
- Document demo-first deploy path clearly (Vercel web-only).
- Optional later: shared golden fixtures JSON for Python/TS parity CI.

---

## 7. Execution plan (this pass)

1. Write this audit + SECURITY notes if needed.
2. Fix upload error handling + API tests.
3. Add TS engine tests + npm test script.
4. UX/a11y pass on lab page (loading, alerts, section nav, captions).
5. Docs: ARCHITECTURE, TECHNICAL_DECISIONS, TESTING, DEPLOYMENT, HANDOFF.
6. Rewrite README for recruiters.
7. Add CI workflow.
8. Verify install/build/test; commit & push branch.

---

## 8. Final checklist (acceptance)

- [x] Install works (web npm / api venv)
- [x] API pytest green (10 tests)
- [x] Web typecheck + build green
- [x] CI present
- [x] README portfolio-grade
- [x] Docs present
- [x] `.env.example` + `.gitignore` safe
- [x] Upload errors handled
- [x] UX loading/empty/error improved
- [x] HANDOFF written
- [ ] Branch pushed (final step)

---

## 9. Recruiter read (honest)

**Strengths:** clear thesis, responsible positioning, working public demo, explainable scores, dual surface (browser lab + FastAPI).  
**Weaknesses before pass:** scaffold smell (docs/CI/tests thin), dual-engine drift risk, upload edge cases, dashboard UX polish.  
**Interview angle:** “intelligence layer, not helpdesk; heuristics first; high-risk human review; synthetic seed only.”
