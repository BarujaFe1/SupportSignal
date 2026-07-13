# SupportSignal — Portfolio Handoff

**Date:** 2026-07-13  
**Branch:** `chore/portfolio-quality-pass`  
**Role recommendation:** **Laboratório** (Tier B — selected lab demo, not “destaque enterprise”)

## Before → After

| Area | Before | After |
|---|---|---|
| Score sense | ~6.4 scaffold → claimed 8.3–8.6 after quality pass | Evidence strengthened: parity fixtures + real screenshots + fresh deploy |
| Classifier robustness | Separate Python/TS tests only | Shared golden fixtures (`data/fixtures/classifier_parity.json`) asserted on both sides |
| Deploy | `supportsignal-lab.vercel.app` served **stale** build (no skip-link/section-nav/claims) | Fresh prod on `https://supportsignal-lab-lake.vercel.app` with quality UI |
| Visual evidence | Generated placeholder PNGs | Playwright captures of real cockpit (synthetic seed) |
| Honesty | Banner only | Claims panel + README allow/deny table + DEMO_SCRIPT |

## Findings (this pass)

### P1
- Public demo URL was outdated vs branch UI (confirmed missing `skip-link` / `Claims honestos`).
- Canonical alias `supportsignal-lab.vercel.app` is locked to an older Vercel team/project; new team deploy uses `supportsignal-lab-lake.vercel.app`.

### P2
- Need real screenshots (done).
- Portfolio card may still point to stale URL until portfolio redeploy.

### P3
- Placeholder `08-message-import.png` superseded by `08-claims-honesty.png`.

## Bugs / improvements implemented

- Golden parity cases (exact category/sentiment/urgency/risk/SLA) for Python + Vitest
- Claims honesty panel in UI
- Screenshot capture script + manifest
- README claims table + demo script link
- GitHub homepage updated to fresh deploy
- Docs: DEMO_SCRIPT, CHANGELOG_PORTFOLIO, this handoff

## Gates executed

| Gate | Result |
|---|---|
| API pytest | 11 passed (incl. parity) |
| Web vitest | 5 passed (incl. parity) |
| Web typecheck/build | green (pre-deploy) |
| CI on branch | previously green on quality-pass commits |
| Live HTML markers | skip-link, section-nav, Claims honestos present on new URL |

## Canonical links

- Repo: https://github.com/BarujaFe1/SupportSignal
- Live demo (current): https://supportsignal-lab-lake.vercel.app
- Stale alias (do not prefer): https://supportsignal-lab.vercel.app
- Portfolio site: https://barujafe.vercel.app
- Branch: https://github.com/BarujaFe1/SupportSignal/tree/chore/portfolio-quality-pass

## Limitations

- Heuristic classifier (not LLM, not calibrated ML)
- Dual engines still duplicated code (parity tests mitigate drift)
- No auth / connectors / billing
- Old Vercel alias not transferable without access to previous team project
- Portfolio site redeploy may lag (rate limits historically)

## Next steps

1. Merge `chore/portfolio-quality-pass` → `main` after review
2. Update portfolio card href to `supportsignal-lab-lake.vercel.app`
3. Optionally retire/redirect old Vercel project alias
4. Keep claims language stable across README / UI / CV

## Interview one-liner

“SupportSignal is a support **intelligence lab**: heuristic topic classification, SLA, explainable refund-risk scoring and a weekly action memo on synthetic tickets — not a helpdesk and not autonomous AI.”
