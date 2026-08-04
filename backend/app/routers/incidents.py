"""The incidents API — one contract, any source, re-triaged on every request.

Stateless by design: the caller supplies its replay start time, so any instance can serve
any poll. See ``sources/base.py`` for why that matters.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from ..engine import cluster_and_triage
from ..models.incident import IncidentsResponse
from ..sources import SourceError, get_sources
from ..sources.seattle import SEATTLE_CENTER

router = APIRouter(tags=["incidents"])


@router.get("/incidents", response_model=IncidentsResponse)
async def get_incidents(
    mode: str = Query("scenario", description="scenario | live"),
    since: float | None = Query(
        None,
        description=(
            "Unix timestamp (seconds) when the caller started its replay. Drives the "
            "mission clock for scripted feeds. Omit to receive the complete scenario."
        ),
    ),
    fresh: bool = Query(False, description="Bypass the live cache and re-fetch upstream."),
) -> IncidentsResponse:
    sources = get_sources()
    source = sources.get(mode, sources["scenario"])

    try:
        snap = await source.snapshot(since=since, fresh=fresh)
    except SourceError as e:
        # Soft-fail in-band so the UI keeps the last good picture and marks it stale,
        # rather than blanking the map — an empty map must never mean "we lost the feed".
        return IncidentsResponse(
            mode=mode, scenario="Live · Seattle Fire & EMS 911", center=SEATTLE_CENTER,
            raw_received=0, raw_total=0, raw_feed=[], incidents=[],
            elapsed=0, scenario_duration=1, feed_complete=False,
            error=f"live feed unavailable: {e}",
        )

    incidents = cluster_and_triage(snap.reports)
    feed = sorted(snap.reports, key=lambda r: r.t, reverse=True)  # newest-first ticker

    return IncidentsResponse(
        mode=source.mode,
        scenario=snap.scenario,
        center=snap.center,
        raw_received=len(snap.reports),
        raw_total=snap.raw_total,
        raw_feed=feed,
        incidents=incidents,
        elapsed=snap.elapsed,
        scenario_duration=snap.scenario_duration,
        feed_complete=snap.feed_complete,
    )
