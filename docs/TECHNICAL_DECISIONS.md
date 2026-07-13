# SupportSignal — Technical Decisions

## ADR-001 — Intelligence layer, not helpdesk

**Decision:** Product thesis is analytics/triage on top of existing channels.  
**Why:** Helpdesk market is crowded; differentiation is root-cause + refund risk + SLA insight.  
**Consequence:** No agent inbox, no auto-replies in MVP.

## ADR-002 — Heuristics before opaque LLMs

**Decision:** MVP classification is rule-based with explainable drivers.  
**Why:** Portfolio honesty, predictable costs, human review for high risk, easier tests.  
**Consequence:** Lower linguistic coverage than an LLM; documented limitation.

## ADR-003 — Frontend-first public demo

**Decision:** Vercel hosts Next.js with browser engine + static seed JSON.  
**Why:** FastAPI on free hosting is heavier; demo must be one-click and stable.  
**Consequence:** Dual Python/TS engines; FastAPI remains for local/API workflows and CSV upload.

## ADR-004 — Synthetic seed only in public surfaces

**Decision:** Ship anonymized synthetic inbox (240 messages).  
**Why:** Privacy, reproducibility, no real customer data risk.  
**Consequence:** Metrics are illustrative, not customer evidence.

## ADR-005 — Human review for high refund risk

**Decision:** Scores ≥ 70 enter watchlist; copy mandates human review.  
**Why:** Avoid overclaiming automated refund decisions.  
**Consequence:** Product narrative emphasizes responsibility over automation.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Dual engines | Stable public demo + local API | Parity maintenance |
| Keyword rules | Explainability + cheap tests | Misses paraphrases |
| Single-page cockpit | Fast storytelling | Less modular routing |
| No auth in lab | Instant recruiter demo | Not multi-tenant ready |
