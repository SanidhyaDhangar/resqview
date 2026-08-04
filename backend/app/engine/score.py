"""Step 3 — score a cluster's severity from category, urgency and corroboration.

## Why the scoring works the way it does

The obvious formula — ``base * urgency * corroboration``, clamped to 10 — is what this
engine used first, and it fails at exactly the moment it matters. Urgency multipliers
compound (six signals on one report reach x2.18), corroboration multiplies again, and any
serious incident blows past the ceiling. Everything life-threatening then pins to a flat
``10.0``: a rooftop rescue with a child, a structure fire and a stranded patient all tie,
and a "worst-first" queue silently stops ranking precisely where ranking saves lives.

So severity is instead built as **headroom consumption**:

    severity = base + (10 - base) * boost
    boost    = 1 - exp(-(urgency_weight + corroboration_weight) / K)

- The **category** sets a floor. A fire starts at 9; a power cut starts at 4. Nothing can
  push a power cut above a fire's floor, which is the correct triage prior.
- **Urgency and corroboration** spend the remaining headroom toward 10. They are summed as
  additive evidence weights, then passed through a saturating curve, so the tenth
  corroborating report adds far less than the second — real diminishing returns.
- ``boost`` is strictly increasing and asymptotic to 1, so **severity approaches 10 but
  never reaches it, and never clamps.** Distinct evidence always produces distinct scores,
  and the ordering at the top of the queue is preserved.

10.0 is deliberately unreachable: no evidence set is ever perfectly certain, and a triage
tool that claims certainty invites the automation bias this project exists to avoid.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from math import exp

from .categories import URGENCY_SIGNALS
from .classify import Classified

SEVERITY_CEILING = 10.0

# How fast accumulated evidence consumes the headroom to the ceiling. Larger = slower.
EVIDENCE_SCALE = 2.0

# Evidence weight per additional corroborating report, and per additional distinct channel.
# A second *channel* counts for more than a second report on the same channel: independent
# confirmation is stronger evidence than repetition.
WEIGHT_PER_EXTRA_REPORT = 0.25
WEIGHT_PER_EXTRA_SOURCE = 0.35


@dataclass
class Score:
    """A severity score with its decomposition kept intact for explanation."""

    base: float
    severity: float
    confidence: int              # number of corroborating reports
    n_sources: int               # number of distinct channels
    urgency_weight: float        # summed evidence weight from urgency signals
    corroboration_weight: float  # summed evidence weight from corroboration
    boost: float                 # fraction of available headroom consumed (0..1)
    signals: list[str] = field(default_factory=list)  # urgency signals seen, deduplicated


def urgency_weight(signals: list[str]) -> float:
    """Additive evidence weight for a set of urgency signals.

    Each signal contributes ``multiplier - 1``, so the tuning table in ``categories.py``
    stays the single place to adjust urgency. Additive (not multiplicative) because these
    are pieces of evidence about one incident, and because the saturating curve downstream
    is what should handle diminishing returns — not an unbounded product.
    """
    return sum(URGENCY_SIGNALS[s] - 1.0 for s in signals if s in URGENCY_SIGNALS)


def corroboration_weight(n_reports: int, n_sources: int) -> float:
    """Additive evidence weight from repetition and independent confirmation."""
    return (
        max(0, n_reports - 1) * WEIGHT_PER_EXTRA_REPORT
        + max(0, n_sources - 1) * WEIGHT_PER_EXTRA_SOURCE
    )


def score_cluster(cl: list[Classified]) -> Score:
    """Score one cluster of reports that all describe the same incident."""
    base = max(x.base for x in cl)

    # Union the signals across the cluster: different callers reveal different facts about
    # the same event, and this matches the evidence we show the responder in the drawer.
    signals = sorted({sig for x in cl for sig in x.matched})

    n_reports = len(cl)
    n_sources = len({x.source for x in cl})

    u_weight = urgency_weight(signals)
    c_weight = corroboration_weight(n_reports, n_sources)

    boost = 1.0 - exp(-(u_weight + c_weight) / EVIDENCE_SCALE)
    severity = round(base + (SEVERITY_CEILING - base) * boost, 1)

    return Score(
        base=base,
        severity=severity,
        confidence=n_reports,
        n_sources=n_sources,
        urgency_weight=round(u_weight, 2),
        corroboration_weight=round(c_weight, 2),
        boost=round(boost, 3),
        signals=signals,
    )
