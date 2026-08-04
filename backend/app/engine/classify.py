"""Step 1 — classify a raw report into a category + urgency (rule-based, explainable)."""
from __future__ import annotations

from dataclasses import dataclass, field

from .categories import CATEGORIES, URGENCY_SIGNALS


@dataclass
class Classified:
    """Internal working type between classification and clustering."""
    id: str
    source: str
    lat: float
    lon: float
    text: str
    t: int
    category: str
    base: float
    urgency: float
    matched: list = field(default_factory=list)


def classify_report(r) -> Classified:
    """Extract category + urgency from a report.

    If the source already carries a structured ``category`` (e.g. a 911 CAD
    dispatch type) we trust it; otherwise we keyword-match the free text.
    Urgency is always read from the text.
    """
    text = r.text.lower()

    if r.category:
        best_cat = r.category
        best_base = r.base if r.base is not None else CATEGORIES.get(best_cat, {}).get("base", 5)
    else:
        best_cat, best_base, best_hits = "infra", 3, 0
        for cat, cfg in CATEGORIES.items():
            hits = [kw for kw in cfg["kw"] if kw in text]
            if len(hits) > best_hits or (len(hits) == best_hits and cfg["base"] > best_base):
                if hits:
                    best_cat, best_base, best_hits = cat, cfg["base"], len(hits)

    urgency = 1.0
    matched: list[str] = []
    for sig, mult in URGENCY_SIGNALS.items():
        if sig in text:
            urgency *= mult
            matched.append(sig)

    return Classified(
        id=r.id, source=r.source, lat=r.lat, lon=r.lon, text=r.text, t=r.t,
        category=best_cat, base=best_base, urgency=round(urgency, 2), matched=matched,
    )
