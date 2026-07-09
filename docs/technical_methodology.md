# SupportSignal — Technical Methodology

## Classification (MVP)
Rule-based keyword scoring over subject+body with configurable category dictionaries:
billing, onboarding, bug, delivery, product_clarity, refund, account_access, other.

## Sentiment & urgency
Lexicon heuristics. Urgency elevates for refund/bug language and explicit urgency markers.

## SLA
`first_response_hours = first_response_at - created_at`.
Default breach targets: 4h (high urgency) / 24h (otherwise). Open tickets without first response are flagged.

## Refund risk (0–100)
Additive explainable score from category, sentiment, urgency, chargeback/legal language and repeat-contact cues. Scores ≥ 70 enter the watchlist and require human review.

## Privacy
Dashboard previews mask emails. Demo dataset is synthetic. Production mailbox sync is optional and out of MVP scope.

## Limitations
MVP is intentionally not an opaque LLM black box. Future model-assisted classification should remain reviewable, with human confirmation on high-risk actions.
