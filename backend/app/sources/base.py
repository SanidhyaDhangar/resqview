"""The contract every feed implements — the seam that makes the source swappable.

Sources are **stateless across requests**. A feed's position in time is derived from
values the caller supplies, never from instance memory, so any request can be served by
any process. That is what lets this deploy to serverless platforms where consecutive
polls routinely land on different instances: without it the mission clock would jump
between requests and a replay would be impossible to follow.
"""
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
    async def snapshot(self, since: float | None = None, fresh: bool = False) -> Snapshot:
        """Return the currently-available reports and metadata.

        Args:
            since: Unix timestamp (seconds) at which the caller started its replay.
                Scripted feeds derive the mission clock from it. ``None`` means "no replay
                in progress" — serve the feed in full.
            fresh: Bypass caching and re-fetch from upstream. Used by the operator's
                explicit refresh, which must never hand back a stale picture.
        """
