"""API tests for SupportSignal."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.analyzer import classify_category, refund_risk_score

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["service"] == "supportsignal-api"


def test_demo_summary():
    r = client.get("/api/demo")
    assert r.status_code == 200
    body = r.json()
    assert body["rows"] > 0
    assert "email" in body["channels"] or len(body["channels"]) >= 1


def test_analyze_demo():
    r = client.post("/api/analyze")
    assert r.status_code == 200
    body = r.json()
    assert body["total_messages"] > 0
    assert body["topics"]
    assert body["messages"]
    assert body["actions"]


def test_weekly_report():
    r = client.get("/api/report/weekly")
    assert r.status_code == 200
    body = r.json()
    assert "executive_summary" in body
    assert body["recommended_actions"]


def test_methodology():
    r = client.get("/api/methodology")
    assert r.status_code == 200
    assert r.json()["product"] == "SupportSignal"


def test_classify_refund_language():
    assert classify_category("Quero reembolso imediato da cobrança") == "refund"
    score, drivers = refund_risk_score(
        "Quero reembolso imediato chargeback", "refund", "negative", "high"
    )
    assert score >= 70
    assert drivers
