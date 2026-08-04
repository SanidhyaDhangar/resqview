"""A raw, single-channel report — the engine's input unit."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Report(BaseModel):
    id: str
    t: int = Field(description="Arrival time, in scenario-seconds from the feed start.")
    source: str = Field(description="Channel: 112 / 911 / twitter / sms / sensor …")
    lat: float
    lon: float
    text: str
    # Optional pre-classification: structured feeds (e.g. a 911 CAD dispatch type)
    # can hand us a trusted category + base severity instead of free text.
    category: str | None = None
    base: float | None = None
