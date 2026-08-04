"""Step 4 — orchestrate classify -> cluster -> score -> explain into ranked incidents."""
from __future__ import annotations

from dataclasses import asdict

from ..models.incident import ClassifiedReport, Incident, ScoreBreakdown
from .categories import ESCALATION_SIGNALS
from .classify import classify_report
from .cluster import cluster
from .score import Score, score_cluster


def _explain(s: Score, sources: list[str], escalating: bool, category: str) -> list[str]:
    """Turn a score into the sentences a responder reads under pressure.

    Ordered the way a responder asks: what is it, what pushed it higher, how sure are we,
    and what did that add up to. Every number here also appears in the machine-readable
    breakdown, so the reasoning can be checked rather than trusted.
    """
    reasons = [f"Category '{category}' sets a base severity of {s.base:g}/10"]

    if s.signals:
        reasons.append(
            f"Urgency signals ({', '.join(s.signals)}) add {s.urgency_weight:g} evidence weight"
        )

    if s.confidence > 1:
        channels = f"{s.n_sources} channel{'s' if s.n_sources > 1 else ''}"
        reasons.append(
            f"{s.confidence} corroborating reports across {channels} "
            f"add {s.corroboration_weight:g} evidence weight"
        )

    if s.n_sources > 1:
        reasons.append(f"Multi-source verified ({', '.join(sources)}) — independent confirmation")

    if escalating:
        reasons.append("Trend: escalating (worsening language across reports)")

    headroom = round(s.severity - s.base, 1)
    if headroom > 0:
        reasons.append(
            f"Evidence consumed {s.boost:.0%} of the headroom above base "
            f"→ severity {s.severity:g} (base {s.base:g} + {headroom:g})"
        )
    else:
        reasons.append(f"No urgency or corroboration signals → severity stays at base {s.base:g}")

    return reasons


def cluster_and_triage(reports) -> list[Incident]:
    """Turn raw reports into deduplicated, scored, explainable incidents (severity-ranked)."""
    classified = [classify_report(r) for r in reports]
    clusters = cluster(classified)

    incidents: list[Incident] = []
    for i, cl in enumerate(clusters):
        s = score_cluster(cl)
        sources = sorted({x.source for x in cl})
        category = cl[0].category
        escalating = any(sig in x.matched for x in cl for sig in ESCALATION_SIGNALS)

        incidents.append(Incident(
            incident_id=f"INC-{i + 1:03d}",
            category=category,
            lat=round(sum(x.lat for x in cl) / len(cl), 5),
            lon=round(sum(x.lon for x in cl) / len(cl), 5),
            severity=s.severity,
            confidence=s.confidence,
            sources=sources,
            summary=max((x.text for x in cl), key=len),  # longest = most informative
            reasons=_explain(s, sources, escalating, category),
            breakdown=ScoreBreakdown(
                base=s.base,
                urgency_weight=s.urgency_weight,
                corroboration_weight=s.corroboration_weight,
                boost=s.boost,
                signals=s.signals,
                severity=s.severity,
            ),
            reports=[ClassifiedReport(**asdict(x)) for x in cl],
            first_t=min(x.t for x in cl),
            last_t=max(x.t for x in cl),
            escalating=escalating,
        ))

    # Worst first. Ties are rare by construction now, but the queue must still be
    # deterministic when they happen: break on corroboration, then on recency.
    incidents.sort(key=lambda x: (-x.severity, -x.confidence, -x.last_t))
    return incidents
