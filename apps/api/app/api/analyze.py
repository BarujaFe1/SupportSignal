from fastapi import APIRouter, File, HTTPException, UploadFile

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
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV uploads are supported (.csv).",
        )
    content = await file.read()
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        return analyze_uploaded_csv(content, filename=filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pandas parser / encoding issues
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV '{filename}': {exc}",
        ) from exc
