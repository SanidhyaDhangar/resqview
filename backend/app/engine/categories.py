"""Domain knowledge for the rule-based classifier — the one place to tune triage."""
from __future__ import annotations

# keyword -> category, each with a base severity (0-10)
CATEGORIES: dict[str, dict] = {
    "rescue":  {"base": 8, "kw": ["trapped", "stranded", "roof", "stuck", "boat", "rescue", "second floor", "2nd floor", "upper floor"]},
    "fire":    {"base": 9, "kw": ["fire", "flames", "smoke", "burning", "warehouse fire"]},
    "medical": {"base": 8, "kw": ["heart attack", "insulin", "diabetic", "collapsed", "ambulance", "injured", "pinned", "unconscious", "bleeding"]},
    "hazard":  {"base": 9, "kw": ["gas", "ruptured", "leak", "explosion", "chemical"]},
    "flood":   {"base": 6, "kw": ["water level", "flood", "levee", "rising", "overtopping", "water rising"]},
    "infra":   {"base": 4, "kw": ["power", "grid", "offline", "outage", "road", "blocked", "fallen tree", "bridge"]},
    "shelter": {"base": 5, "kw": ["shelter", "food", "water and food", "supplies", "no power", "running out"]},
}

# Urgency multipliers: text signals that escalate any report.
URGENCY_SIGNALS: dict[str, float] = {
    "child": 1.5, "baby": 1.5, "kid": 1.3, "children": 1.4,
    "rising": 1.3, "worse": 1.3, "fast": 1.2, "hurry": 1.2,
    "inside": 1.3, "trapped": 1.4, "still": 1.15, "now": 1.1,
}

# Reports within this distance + same category collapse into one incident.
CLUSTER_RADIUS_M: float = 180.0

# Signals that mark an incident as worsening over time.
ESCALATION_SIGNALS: tuple[str, ...] = ("rising", "worse", "fast")
