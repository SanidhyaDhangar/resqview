"""Scripted source — the authored Mumbai monsoon-flood scenario, replayed over time.

The replay clock is **owned by the caller**. The client records when it started and sends
that timestamp with every poll; this source turns it into a position in the feed. Nothing
about where the replay has reached is stored here, so consecutive polls served by
different processes still agree on the time — and restarting the replay costs no round
trip at all, because the client simply picks a new start time.
"""
from __future__ import annotations

import json
import pathlib
import time

from ..models.report import Report
from .base import ReportSource, Snapshot


class ScenarioSource(ReportSource):
    mode = "scenario"

    def __init__(self, data_path: str, time_scale: float = 2.5):
        raw = json.loads(pathlib.Path(data_path).read_text(encoding="utf-8"))
        self.scenario: str = raw["scenario"]
        self.center: list[float] = raw["center"]
        self.reports: list[Report] = [Report(**r) for r in raw["reports"]]
        self.time_scale = time_scale
        self.duration = max(r.t for r in self.reports)

    def _elapsed_scenario_seconds(self, since: float | None) -> float:
        """Position in the feed, in scenario-seconds, for a replay started at ``since``."""
        if since is None:
            # No replay in progress: serve the complete scenario, so that a bare
            # `curl /api/incidents` shows the whole picture rather than an empty one.
            return float(self.duration)

        wall_elapsed = max(0.0, time.time() - since)
        return min(wall_elapsed * self.time_scale, float(self.duration))

    async def snapshot(self, since: float | None = None, fresh: bool = False) -> Snapshot:
        now = self._elapsed_scenario_seconds(since)
        released = [r for r in self.reports if r.t <= now]
        return Snapshot(
            reports=released,
            scenario=self.scenario,
            center=self.center,
            raw_total=len(self.reports),
            elapsed=round(now, 1),
            scenario_duration=self.duration,
            feed_complete=len(released) >= len(self.reports),
        )
