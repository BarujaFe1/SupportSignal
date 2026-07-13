"""Parity tests: Python classifier must match golden fixtures shared with TypeScript."""

from __future__ import annotations

import json
from pathlib import Path

from app.services.analyzer import classify_message

ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "data" / "fixtures" / "classifier_parity.json"


def test_classifier_parity_golden_cases():
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    assert payload["cases"], "parity fixture must not be empty"
    for case in payload["cases"]:
        got = classify_message(case["message"])
        exp = case["expect"]
        assert got["category"] == exp["category"], case["id"]
        assert got["sentiment"] == exp["sentiment"], case["id"]
        assert got["urgency"] == exp["urgency"], case["id"]
        assert got["refund_risk"] == exp["refund_risk"], case["id"]
        assert got["sla_breach"] == exp["sla_breach"], case["id"]
        assert got["sla_hours"] == exp["sla_hours"], case["id"]
        assert "c***@example.com" in got["masked_preview"] or "@" not in got["masked_preview"]
