"""Demo dataset loader for SupportSignal."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
SEED_CSV = ROOT / "data" / "seed" / "support_inbox_demo.csv"


def _mask_email(email: str | None) -> str:
    if not email or "@" not in email:
        return "c***@example.com"
    local, domain = email.split("@", 1)
    return f"{local[:1]}***@{domain}"


def load_demo_frame() -> pd.DataFrame:
    if not SEED_CSV.exists():
        raise FileNotFoundError(
            f"Demo seed missing at {SEED_CSV}. Run scripts/generate_assets_and_seed.py"
        )
    return pd.read_csv(SEED_CSV)


def load_demo_messages() -> list[dict]:
    df = load_demo_frame()
    records: list[dict] = []
    for _, row in df.iterrows():
        records.append(
            {
                "message_id": str(row["message_id"]),
                "channel": str(row["channel"]),
                "subject": str(row.get("subject", "")),
                "body": str(row["body"]),
                "created_at": str(row["created_at"]),
                "first_response_at": (
                    None
                    if pd.isna(row.get("first_response_at"))
                    else str(row["first_response_at"])
                ),
                "resolved_at": (
                    None if pd.isna(row.get("resolved_at")) else str(row["resolved_at"])
                ),
                "customer_email": (
                    None
                    if pd.isna(row.get("customer_email"))
                    else str(row["customer_email"])
                ),
                "customer_name": (
                    None
                    if pd.isna(row.get("customer_name"))
                    else str(row["customer_name"])
                ),
                "status": str(row.get("status", "open")),
            }
        )
    return records


def load_demo_summary() -> dict:
    df = load_demo_frame()
    channels = sorted(df["channel"].dropna().unique().tolist())
    return {
        "rows": int(len(df)),
        "channels": channels,
        "open_rate": float((df["status"] == "open").mean()) if len(df) else 0.0,
        "date_span": {
            "from": str(df["created_at"].min()) if len(df) else None,
            "to": str(df["created_at"].max()) if len(df) else None,
        },
        "sample_masked_contacts": [
            _mask_email(e) for e in df["customer_email"].dropna().head(3).tolist()
        ],
        "notice": (
            "Synthetic anonymized support inbox for portfolio demo. "
            "Not production customer data."
        ),
    }
