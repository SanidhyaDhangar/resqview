"""The contract every feed implements — the seam that makes the source swappable."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from ..models.report import Report


@dataclass
class Snapshot:
    """A point-in-time view of a feed: the released raw reports + scenario chrome."""
    reports: list[Report]
    scenario: str
    center: list[float]
    raw_total: int
    elapsed: float
    scenario_duration: float
    feed_complete: bool


class SourceError(Exception):
    """Raised when a feed is temporarily unavailable (e.g. live fetch failed)."""


class ReportSource(ABC):
    mode: str

    @abstractmethod
    async def snapshot(self) -> Snapshot:
        """Return the currently-available reports and metadata."""

    def reset(self) -> None:
        """Restart the feed (scenario clock) or clear caches (live)."""
