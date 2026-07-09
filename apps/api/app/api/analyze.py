from fastapi import APIRouter, File, UploadFile

from app.services.analyzer import analyze_messages, analyze_uploaded_csv
from app.services.demo_data import load_demo_messages

router = APIRouter(tags=["analyze"])


@router.post("/analyze")
async def analyze_demo():
    """Classify demo support messages and return operational intelligence."""
    messages = load_demo_messages()
    return analyze_messages(messages)


@router.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...)):
    """Classify an uploaded CSV of support messages (subject, body, channel, created_at)."""
    content = await file.read()
    return analyze_uploaded_csv(content, filename=file.filename or "upload.csv")
