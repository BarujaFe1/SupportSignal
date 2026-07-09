from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analyze, demo, health, methodology, report

app = FastAPI(
    title="SupportSignal API",
    description=(
        "Support intelligence layer: classify messages, measure SLA, "
        "score refund risk, explore root causes and generate weekly action memos."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(demo.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(methodology.router, prefix="/api")
