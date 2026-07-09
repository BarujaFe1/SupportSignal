"""Weekly support memo builder."""

from __future__ import annotations

from typing import Any


def build_weekly_memo(analysis: dict[str, Any]) -> dict[str, Any]:
    topics = analysis.get("topics") or []
    top_causes = [
        {
            "category": t["category"],
            "count": t["count"],
            "share_pct": round(t["share"] * 100, 1),
            "avg_refund_risk": t["avg_refund_risk"],
        }
        for t in topics[:5]
    ]
    watch = [
        {
            "message_id": m["message_id"],
            "category": m["category"],
            "refund_risk": m["refund_risk"],
            "preview": m["masked_preview"],
        }
        for m in analysis.get("messages", [])
        if m["refund_risk"] >= 70
    ][:8]

    top_label = top_causes[0]["category"] if top_causes else "outros"
    summary = (
        f"Na janela demo, {analysis['total_messages']} mensagens foram classificadas. "
        f"Tema dominante: {top_label}. "
        f"Breach de SLA: {analysis['sla_breach_rate']*100:.0f}%. "
        f"Alto risco de reembolso: {analysis['high_refund_risk_count']} casos."
    )

    return {
        "title": "SupportSignal Weekly Memo",
        "period_label": "Demo week (synthetic inbox)",
        "executive_summary": summary,
        "top_causes": top_causes,
        "sla_snapshot": {
            "avg_first_response_hours": analysis.get("avg_first_response_hours"),
            "sla_breach_rate": analysis.get("sla_breach_rate"),
            "open_messages": analysis.get("open_messages"),
        },
        "refund_watchlist": watch,
        "recommended_actions": analysis.get("actions", []),
        "caveats": [
            "Classificação MVP é heurística e exige revisão humana em risco alto.",
            "Dataset sintético — não usar como evidência de clientes reais.",
            "Produto é camada de inteligência; não automatiza atendimento completo.",
        ],
    }
