from fastapi import APIRouter

from app.services.analyzer import analyze_messages
from app.services.demo_data import load_demo_messages
from app.services.report import build_weekly_memo

router = APIRouter(tags=["report"])


@router.get("/report/weekly")
async def weekly_report():
    """Generate a weekly support memo with root causes and recommended actions."""
    analysis = analyze_messages(load_demo_messages())
    return build_weekly_memo(analysis)
