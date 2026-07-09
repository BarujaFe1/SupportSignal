from fastapi import APIRouter

router = APIRouter(tags=["methodology"])


@router.get("/methodology")
async def methodology():
    return {
        "product": "SupportSignal",
        "positioning": "Intelligence layer for existing support — not a full helpdesk.",
        "classification": {
            "method": "Configurable keyword + heuristic rules (MVP)",
            "categories": [
                "billing",
                "onboarding",
                "bug",
                "delivery",
                "product_clarity",
                "refund",
                "account_access",
                "other",
            ],
            "human_review": "Required for high-risk refund and churn signals",
        },
        "sla": {
            "first_response_hours": "created_at → first_response_at",
            "resolution_hours": "created_at → resolved_at when available",
            "breach": "first_response_hours > target (default 4h for urgent, 24h otherwise)",
        },
        "refund_risk": {
            "signals": [
                "refund / chargeback language",
                "negative sentiment",
                "urgency",
                "repeat contact",
                "billing category",
            ],
            "score_range": "0–100 heuristic score with explainable drivers",
        },
        "privacy": {
            "default": "Mask emails and names in dashboard views",
            "mvp": "Local CSV/demo import; no production mailbox required",
        },
        "limitations": [
            "MVP classification is rule-based, not a production LLM pipeline",
            "Does not auto-reply or replace agents",
            "Demo data is synthetic and anonymized",
        ],
    }
