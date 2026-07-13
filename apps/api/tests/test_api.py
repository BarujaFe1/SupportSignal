"""API tests for SupportSignal."""

from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app
from app.services.analyzer import classify_category, refund_risk_score, sla_hours

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


def test_sla_hours_computation():
    hours = sla_hours("2026-06-01T09:00:00", "2026-06-01T11:30:00")
    assert hours == 2.5


def test_upload_rejects_empty_file():
    files = {"file": ("empty.csv", BytesIO(b""), "text/csv")}
    r = client.post("/api/analyze/upload", files=files)
    assert r.status_code == 400


def test_upload_rejects_missing_columns():
    payload = b"foo,bar\n1,2\n"
    files = {"file": ("bad.csv", BytesIO(payload), "text/csv")}
    r = client.post("/api/analyze/upload", files=files)
    assert r.status_code == 400
    assert "missing columns" in r.json()["detail"].lower()


def test_upload_valid_csv():
    payload = (
        b"message_id,body,created_at,channel,subject,status\n"
        b"MSG-U1,Quero reembolso imediato chargeback,2026-06-01T10:00:00,email,Refund,open\n"
    )
    files = {"file": ("ok.csv", BytesIO(payload), "text/csv")}
    r = client.post("/api/analyze/upload", files=files)
    assert r.status_code == 200
    body = r.json()
    assert body["total_messages"] == 1
    assert body["messages"][0]["category"] == "refund"
