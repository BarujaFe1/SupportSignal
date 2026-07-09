from fastapi import APIRouter

from app.services.demo_data import load_demo_summary

router = APIRouter(tags=["demo"])


@router.get("/demo")
async def demo_dataset():
    """Return summary of the synthetic support-inbox demo dataset."""
    return load_demo_summary()
