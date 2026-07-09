"""Rule-based classification, SLA and refund-risk scoring for SupportSignal MVP."""

from __future__ import annotations

import io
import re
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

import pandas as pd

CATEGORY_RULES: list[tuple[str, list[str]]] = [
    (
        "refund",
        [
            "reembolso",
            "refund",
            "chargeback",
            "estorno",
            "quero meu dinheiro",
            "cancelar assinatura",
            "cancelamento",
        ],
    ),
    (
        "billing",
        [
            "cobrança",
            "cobranca",
            "fatura",
            "invoice",
            "cartão",
            "cartao",
            "pagamento",
            "assinatura",
            "preço",
            "preco",
            "valor cobrado",
        ],
    ),
    (
        "bug",
        [
            "bug",
            "erro",
            "não funciona",
            "nao funciona",
            "quebrado",
            "crash",
            "falha",
            "500",
            "tela branca",
        ],
    ),
    (
        "onboarding",
        [
            "onboarding",
            "como começar",
            "como comecar",
            "primeiro acesso",
            "tutorial",
            "não entendi",
            "nao entendi",
            "configurar",
        ],
    ),
    (
        "delivery",
        [
            "entrega",
            "atraso",
            "tracking",
            "rastreio",
            "pedido não chegou",
            "pedido nao chegou",
            "frete",
            "envio",
        ],
    ),
    (
        "product_clarity",
        [
            "como usar",
            "documentação",
            "documentacao",
            "confuso",
            "não está claro",
            "nao esta claro",
            "explicação",
            "explicacao",
            "feature",
        ],
    ),
    (
        "account_access",
        [
            "login",
            "senha",
            "acesso",
            "2fa",
            "bloqueado",
            "não consigo entrar",
            "nao consigo entrar",
            "reset",
        ],
    ),
]

NEGATIVE = [
    "péssimo",
    "pessimo",
    "horrível",
    "horrivel",
    "raiva",
    "absurdo",
    "inaceitável",
    "inaceitavel",
    "frustrado",
    "irritado",
    "péssima",
    "pessima",
]
POSITIVE = ["obrigado", "obrigada", "ótimo", "otimo", "excelente", "resolvido", "agradeço", "agradeco"]
URGENT = [
    "urgente",
    "asap",
    "hoje",
    "agora",
    "imediato",
    "crítico",
    "critico",
    "chargeback",
    "advogado",
]

ROOT_CAUSES = {
    "refund": "Política de cancelamento / expectativa de valor não alinhada",
    "billing": "Cobrança confusa ou falha de comunicação de preço",
    "bug": "Defeito de produto impactando jornada crítica",
    "onboarding": "Onboarding incompleto ou fricção no primeiro uso",
    "delivery": "Atraso operacional de entrega / logística",
    "product_clarity": "Produto ou documentação mal explicados",
    "account_access": "Fricção de autenticação / recuperação de conta",
    "other": "Sinal misto — revisar manualmente",
}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def classify_category(text: str) -> str:
    t = _norm(text)
    scores: Counter[str] = Counter()
    for category, keywords in CATEGORY_RULES:
        for kw in keywords:
            if kw in t:
                scores[category] += 1
    if not scores:
        return "other"
    return scores.most_common(1)[0][0]


def classify_sentiment(text: str) -> str:
    t = _norm(text)
    neg = sum(1 for w in NEGATIVE if w in t)
    pos = sum(1 for w in POSITIVE if w in t)
    if neg > pos:
        return "negative"
    if pos > neg:
        return "positive"
    return "neutral"


def classify_urgency(text: str, category: str) -> str:
    t = _norm(text)
    if any(w in t for w in URGENT) or category in {"refund", "bug"}:
        return "high"
    if category in {"billing", "account_access", "delivery"}:
        return "medium"
    return "low"


def refund_risk_score(text: str, category: str, sentiment: str, urgency: str) -> tuple[int, list[str]]:
    score = 10
    drivers: list[str] = []
    t = _norm(text)
    if category == "refund":
        score += 45
        drivers.append("Categoria reembolso/cancelamento")
    if category == "billing":
        score += 20
        drivers.append("Categoria cobrança")
    if sentiment == "negative":
        score += 18
        drivers.append("Sentimento negativo")
    if urgency == "high":
        score += 12
        drivers.append("Urgência alta")
    for kw in ("chargeback", "procon", "advogado", "reembolso imediato"):
        if kw in t:
            score += 15
            drivers.append(f"Linguagem de risco: {kw}")
            break
    if "segunda vez" in t or "de novo" in t or "novamente" in t:
        score += 10
        drivers.append("Possível contato repetido")
    return min(100, score), drivers


def parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00").replace(" ", "T"))
    except ValueError:
        return None


def sla_hours(created: str, first_response: str | None) -> float | None:
    c = parse_ts(created)
    r = parse_ts(first_response)
    if not c or not r:
        return None
    return round((r - c).total_seconds() / 3600.0, 2)


def mask_preview(subject: str, body: str, email: str | None) -> str:
    text = f"{subject} — {body}".strip(" —")
    text = re.sub(r"[\w.+-]+@[\w.-]+\.\w+", "c***@example.com", text)
    if email:
        text = text.replace(email, "c***@example.com")
    return (text[:140] + "…") if len(text) > 140 else text


def classify_message(msg: dict[str, Any]) -> dict[str, Any]:
    blob = f"{msg.get('subject', '')} {msg.get('body', '')}"
    category = classify_category(blob)
    sentiment = classify_sentiment(blob)
    urgency = classify_urgency(blob, category)
    risk, drivers = refund_risk_score(blob, category, sentiment, urgency)
    hours = sla_hours(msg.get("created_at", ""), msg.get("first_response_at"))
    target = 4.0 if urgency == "high" else 24.0
    breach = hours is not None and hours > target
    if hours is None and msg.get("status") == "open":
        # Open without response counts as operational risk signal.
        breach = True
        drivers = drivers + ["Sem primeira resposta registrada"]
    return {
        "message_id": msg["message_id"],
        "channel": msg.get("channel", "email"),
        "subject": msg.get("subject", ""),
        "category": category,
        "sentiment": sentiment,
        "urgency": urgency,
        "refund_risk": risk,
        "sla_hours": hours,
        "sla_breach": breach,
        "root_cause": ROOT_CAUSES.get(category, ROOT_CAUSES["other"]),
        "masked_preview": mask_preview(
            msg.get("subject", ""), msg.get("body", ""), msg.get("customer_email")
        ),
        "drivers": drivers,
    }


def _build_actions(topics: list[dict], high_risk: int, breach_rate: float) -> list[dict]:
    actions: list[dict] = []
    if topics:
        top = topics[0]
        actions.append(
            {
                "priority": "P0",
                "title": f"Atacar causa raiz: {top['category']}",
                "rationale": (
                    f"{top['count']} mensagens ({top['share']*100:.0f}%) com risco médio "
                    f"{top['avg_refund_risk']:.0f}."
                ),
                "owner_hint": "Produto + Suporte",
            }
        )
    if high_risk:
        actions.append(
            {
                "priority": "P0",
                "title": "Revisar fila de alto risco de reembolso",
                "rationale": f"{high_risk} mensagens com score ≥ 70 exigem revisão humana.",
                "owner_hint": "Gestor de suporte",
            }
        )
    if breach_rate >= 0.25:
        actions.append(
            {
                "priority": "P1",
                "title": "Reduzir breaches de SLA de primeira resposta",
                "rationale": f"Taxa de breach em {breach_rate*100:.0f}% — revisar cobertura e triagem.",
                "owner_hint": "Operações",
            }
        )
    actions.append(
        {
            "priority": "P2",
            "title": "Publicar memo semanal para founders",
            "rationale": "Transformar sintomas de suporte em backlog de melhoria contínuo.",
            "owner_hint": "Founder / CS",
        }
    )
    return actions


def analyze_messages(messages: list[dict[str, Any]]) -> dict[str, Any]:
    classified = [classify_message(m) for m in messages]
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for row in classified:
        by_cat[row["category"]].append(row)

    total = len(classified) or 1
    topics: list[dict] = []
    for category, rows in sorted(by_cat.items(), key=lambda kv: -len(kv[1])):
        topics.append(
            {
                "category": category,
                "count": len(rows),
                "share": round(len(rows) / total, 4),
                "avg_refund_risk": round(sum(r["refund_risk"] for r in rows) / len(rows), 2),
                "sla_breach_rate": round(sum(1 for r in rows if r["sla_breach"]) / len(rows), 4),
            }
        )

    sla_values = [r["sla_hours"] for r in classified if r["sla_hours"] is not None]
    open_messages = sum(1 for m in messages if m.get("status") == "open")
    high_risk = sum(1 for r in classified if r["refund_risk"] >= 70)
    breach_rate = round(sum(1 for r in classified if r["sla_breach"]) / total, 4)

    emerging = [
        t["category"]
        for t in topics
        if t["share"] >= 0.12 and t["category"] not in {"other"}
    ][:5]

    return {
        "total_messages": len(classified),
        "open_messages": open_messages,
        "avg_first_response_hours": round(sum(sla_values) / len(sla_values), 2)
        if sla_values
        else None,
        "sla_breach_rate": breach_rate,
        "high_refund_risk_count": high_risk,
        "topics": topics,
        "messages": sorted(classified, key=lambda r: (-r["refund_risk"], r["message_id"])),
        "emerging_themes": emerging,
        "actions": _build_actions(topics, high_risk, breach_rate),
        "notice": (
            "Classificação heurística do MVP com revisão humana recomendada para risco alto. "
            "Camada de inteligência — não substitui helpdesk."
        ),
    }


def analyze_uploaded_csv(content: bytes, filename: str = "upload.csv") -> dict[str, Any]:
    df = pd.read_csv(io.BytesIO(content))
    required = {"message_id", "body", "created_at"}
    missing = required - set(c.lower() for c in df.columns)
    # normalize columns
    colmap = {c: c.lower().strip() for c in df.columns}
    df = df.rename(columns=colmap)
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV {filename} missing columns: {sorted(missing)}")
    messages: list[dict] = []
    for _, row in df.iterrows():
        messages.append(
            {
                "message_id": str(row["message_id"]),
                "channel": str(row["channel"]) if "channel" in df.columns and not pd.isna(row.get("channel")) else "email",
                "subject": str(row["subject"]) if "subject" in df.columns and not pd.isna(row.get("subject")) else "",
                "body": str(row["body"]),
                "created_at": str(row["created_at"]),
                "first_response_at": (
                    None
                    if "first_response_at" not in df.columns or pd.isna(row.get("first_response_at"))
                    else str(row["first_response_at"])
                ),
                "resolved_at": (
                    None
                    if "resolved_at" not in df.columns or pd.isna(row.get("resolved_at"))
                    else str(row["resolved_at"])
                ),
                "customer_email": (
                    None
                    if "customer_email" not in df.columns or pd.isna(row.get("customer_email"))
                    else str(row["customer_email"])
                ),
                "customer_name": (
                    None
                    if "customer_name" not in df.columns or pd.isna(row.get("customer_name"))
                    else str(row["customer_name"])
                ),
                "status": str(row["status"]) if "status" in df.columns and not pd.isna(row.get("status")) else "open",
            }
        )
    result = analyze_messages(messages)
    result["notice"] = (
        f"Analisado arquivo {filename} ({len(messages)} mensagens). "
        + result["notice"]
    )
    return result
