"""Engine outputs: a ranked incident and the API response envelope."""
from __future__ import annotations

from pydantic import BaseModel

from .report import Report


class ClassifiedReport(BaseModel):
    """A raw report after classification — carried inside an incident for traceability."""
    id: str
    source: str
    lat: float
    lon: float
    text: str
    t: int
    category: str
    base: float
    urgency: float
    matched: list[str] = []


class ScoreBreakdown(BaseModel):
    """The arithmetic behind a severity score, exposed so a responder can audit it.

    ``severity = base + (10 - base) * boost``, where ``boost`` saturates on the summed
    urgency and corroboration evidence weights. See ``engine/score.py``.
    """
    base: float                  # floor set by the category
    urgency_weight: float        # evidence weight from urgency signals
    corroboration_weight: float  # evidence weight from repetition + independent channels
    boost: float                 # fraction of headroom above base that evidence consumed
    signals: list[str] = []      # the urgency signals actually matched
    severity: float              # the resulting score


class Incident(BaseModel):
    """A deduplicated, scored, explainable incident built from one or more reports."""
    incident_id: str
    category: str
    lat: float
    lon: float
    severity: float
    confidence: int          # number of corroborating reports
    sources: list[str]       # distinct source channels
    summary: str
    reasons: list[str]       # human-readable "why it scored" explanation
    breakdown: ScoreBreakdown
    reports: list[ClassifiedReport]
    first_t: int
    last_t: int
    escalating: bool = False  # worsening language across the cluster


class IncidentsResponse(BaseModel):
    """The single contract both the scripted and live feeds return."""
    mode: str
    scenario: str
    center: list[float]
    raw_received: int
    raw_total: int
    raw_feed: list[Report]
    incidents: list[Incident]
    elapsed: float
    scenario_duration: float
    feed_complete: bool
    error: str | None = None
