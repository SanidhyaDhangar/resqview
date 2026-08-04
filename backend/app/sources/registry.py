"""Single place that wires modes -> source instances (stateful singletons)."""
from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import ReportSource
from .scenario import ScenarioSource
from .seattle import SeattleLiveSource


@lru_cache
def get_sources() -> dict[str, ReportSource]:
    """Build the source registry once; instances keep their state across requests.

    Register a new feed (USGS quakes, NASA fires, an SMS gateway, …) by adding one
    line here — nothing downstream changes.
    """
    s = get_settings()
    return {
        "scenario": ScenarioSource(s.data_path, s.time_scale),
        "live": SeattleLiveSource(s.seattle_url, s.live_ttl),
    }
