"""Engine tests on the real Mumbai scenario — the triage contract should hold."""
import json
import pathlib

from app.engine import cluster_and_triage
from app.models.report import Report

DATA = json.loads(
    (pathlib.Path(__file__).resolve().parent.parent / "data" / "reports.json").read_text(encoding="utf-8")
)


def _reports():
    return [Report(**r) for r in DATA["reports"]]


def test_deduplicates_reports_into_fewer_incidents():
    incs = cluster_and_triage(_reports())
    assert incs, "expected at least one incident"
    assert len(incs) < len(DATA["reports"]), "clustering should collapse duplicates"


def test_incidents_ranked_by_severity_desc():
    sev = [i.severity for i in cluster_and_triage(_reports())]
    assert sev == sorted(sev, reverse=True)


def test_rooftop_rescue_is_corroborated_and_multi_source():
    incs = cluster_and_triage(_reports())
    corroborated = [i for i in incs if i.confidence > 1]
    assert corroborated, "the Hindmata rescue is reported on multiple channels"
    assert any(len(i.sources) > 1 for i in corroborated), "expected a multi-source incident"


def test_severity_stays_within_scale():
    assert all(0 <= i.severity <= 10 for i in cluster_and_triage(_reports()))


def test_structured_report_trusts_preset_category():
    r = Report(id="x", t=0, source="911", lat=47.6, lon=-122.3,
               text="something vague", category="fire", base=9)
    inc = cluster_and_triage([r])[0]
    assert inc.category == "fire"
    assert inc.severity >= 9


# --- Scoring: the queue must actually rank at the critical end -----------------
#
# The engine originally used base * urgency * corroboration clamped to 10, which pinned
# every life-threatening incident to a flat 10.0 and destroyed worst-first ordering
# exactly where it matters. These tests exist so that regression cannot come back.


def test_critical_incidents_do_not_all_tie_at_the_ceiling():
    """The top of the queue must be ordered, not saturated."""
    incs = cluster_and_triage(_reports())
    critical = [i for i in incs if i.severity >= 8]
    assert len(critical) >= 3, "the Mumbai scenario has several critical incidents"
    assert len(set(i.severity for i in critical)) > 1, (
        "critical incidents collapsed to a single score — the queue has stopped ranking"
    )


def test_severity_never_reaches_the_ceiling():
    """10.0 is an asymptote: no evidence set is ever perfectly certain."""
    assert all(i.severity < 10.0 for i in cluster_and_triage(_reports()))


def test_more_evidence_scores_strictly_higher():
    """Adding an independent corroborating report must raise severity, not saturate it."""
    base = Report(id="a", t=0, source="112", lat=19.02, lon=72.84,
                  text="people trapped on the roof, water rising")
    lone = cluster_and_triage([base])[0]

    corroborated = cluster_and_triage([
        base,
        Report(id="b", t=5, source="twitter", lat=19.0201, lon=72.8401,
               text="people trapped on the roof, water rising"),
    ])[0]

    assert corroborated.severity > lone.severity
    assert corroborated.confidence == 2
    assert len(corroborated.sources) == 2


def test_category_floor_is_never_undercut_by_a_lesser_category():
    """A maximally-corroborated power cut must not outrank a bare structure fire."""
    fire = cluster_and_triage([
        Report(id="f", t=0, source="112", lat=19.05, lon=72.90,
               text="structure fire", category="fire", base=9),
    ])[0]

    outage_reports = [
        Report(id=f"o{n}", t=n, source=src, lat=19.10, lon=72.95,
               text="power outage, grid offline")
        for n, src in enumerate(["112", "twitter", "sms", "sensor", "112", "twitter"])
    ]
    outage = cluster_and_triage(outage_reports)[0]

    assert outage.category == "infra"
    assert outage.severity < fire.severity, (
        "corroboration must spend headroom above the category floor, never cross it"
    )


def test_breakdown_arithmetic_matches_reported_severity():
    """The audit trail must reconcile — a responder can recompute the score by hand."""
    for inc in cluster_and_triage(_reports()):
        b = inc.breakdown
        expected = round(b.base + (10.0 - b.base) * b.boost, 1)
        assert expected == inc.severity, f"{inc.incident_id} breakdown does not reconcile"
        assert b.severity == inc.severity


def test_every_incident_explains_itself():
    """Explainability is a contract, not a nicety: no silent flags."""
    for inc in cluster_and_triage(_reports()):
        assert inc.reasons, f"{inc.incident_id} was flagged with no reasoning"
        assert inc.reports, f"{inc.incident_id} has no source evidence attached"
        assert all(r.strip() for r in inc.reasons)


def test_ranking_is_deterministic_regardless_of_arrival_order():
    """Two runs over the same reports in a different order must rank identically."""
    forward = cluster_and_triage(_reports())
    shuffled = cluster_and_triage(list(reversed(_reports())))
    assert [i.severity for i in forward] == [i.severity for i in shuffled]
