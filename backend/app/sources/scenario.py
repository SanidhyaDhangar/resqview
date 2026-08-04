"""Scripted source — the authored Mumbai monsoon-flood scenario, replayed over time."""
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
        self._start = time.monotonic()

    def reset(self) -> None:
        self._start = time.monotonic()

    def _elapsed_scenario_seconds(self) -> float:
        return (time.monotonic() - self._start) * self.time_scale

    async def snapshot(self) -> Snapshot:
        now = self._elapsed_scenario_seconds()
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
