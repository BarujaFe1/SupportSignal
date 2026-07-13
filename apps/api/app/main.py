import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analyze, demo, health, methodology, report

app = FastAPI(
    title="SupportSignal API",
    description=(
        "Support intelligence layer: classify messages, measure SLA, "
        "score refund risk, explore root causes and generate weekly action memos. "
        "Lab/MVP scope — heuristics + human review, not a full helpdesk."
    ),
    version="0.1.1",
)

_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_cors = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(demo.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(methodology.router, prefix="/api")
