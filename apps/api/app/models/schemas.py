"""Pydantic schemas for SupportSignal."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MessageIn(BaseModel):
    message_id: str
    channel: str = "email"
    subject: str = ""
    body: str
    created_at: str
    first_response_at: str | None = None
    resolved_at: str | None = None
    customer_email: str | None = None
    customer_name: str | None = None
    status: str = "open"


class ClassifiedMessage(BaseModel):
    message_id: str
    channel: str
    subject: str
    category: str
    sentiment: str
    urgency: str
    refund_risk: int = Field(ge=0, le=100)
    sla_hours: float | None = None
    sla_breach: bool = False
    root_cause: str
    masked_preview: str
    drivers: list[str] = Field(default_factory=list)


class TopicStat(BaseModel):
    category: str
    count: int
    share: float
    avg_refund_risk: float
    sla_breach_rate: float


class ActionItem(BaseModel):
    priority: str
    title: str
    rationale: str
    owner_hint: str


class AnalysisResponse(BaseModel):
    total_messages: int
    open_messages: int
    avg_first_response_hours: float | None
    sla_breach_rate: float
    high_refund_risk_count: int
    topics: list[TopicStat]
    messages: list[ClassifiedMessage]
    emerging_themes: list[str]
    actions: list[ActionItem]
    notice: str


class WeeklyMemo(BaseModel):
    title: str
    period_label: str
    executive_summary: str
    top_causes: list[dict[str, Any]]
    sla_snapshot: dict[str, Any]
    refund_watchlist: list[dict[str, Any]]
    recommended_actions: list[ActionItem]
    caveats: list[str]
