"""Live source — real Seattle Fire & EMS 911 dispatches (Socrata open data, no key).

Proves the thesis: the simulated feed and a genuine real-time feed run through the
exact same engine and the exact same response contract.
"""
from __future__ import annotations

import datetime as dt
import time

import httpx

from ..models.report import Report
from .base import ReportSource, Snapshot, SourceError

SEATTLE_CENTER = [47.6097, -122.3331]


def classify_seattle(type_str: str | None) -> tuple[str, int] | None:
    """Map a Seattle CAD dispatch type -> (category, base severity), or None to drop.

    The dispatch type is already structured, so we trust it for category and assign a
    realistic base severity. Operational / non-incident codes are filtered out.
    """
    s = (type_str or "").lower()
    noise = ("test", "special event", "investigate", "out of service", "trans to",
             "code red", "code yellow", "1red", "2red", "3red", " unit", "mis ")
    if any(k in s for k in noise):
        return None
    if "fire in building" in s or "structure fire" in s:
        return ("fire", 9)
    if "fire alarm" in s or "alarm bell" in s or "auto alarm" in s or "automatic fire" in s:
        return ("fire", 4)
    if any(k in s for k in ("brush fire", "bark fire", "car fire", "dumpster",
                            "trash fire", "rubbish", "illegal burn", "food on the stove", "fire")):
        return ("fire", 5)
    if any(k in s for k in ("natural gas", "gas odor", "gas leak", "co detector",
                            "carbon monoxide", "hazmat", "hazardous", "fuel spill", "chemical")):
        return ("hazard", 7)
    if "mvi" in s or "motor vehicle" in s:
        return ("rescue", 7)
    if any(k in s for k in ("rescue", "elevator", "water job", "extrication",
                            "technical resc", "confined space")):
        return ("rescue", 6)
    if "overdose" in s or "scenes of violence" in s or "cardiac" in s:
        return ("medical", 8)
    if "medic response" in s:
        return ("medical", 8)
    if "medical alarm" in s or "low acuity" in s:
        return ("medical", 4)
    if "aid response" in s or "aid car" in s:
        return ("medical", 5)
    return ("infra", 3)


def _parse_dt(s) -> float | None:
    try:
        return dt.datetime.fromisoformat(str(s).replace("Z", "")).timestamp()
    except Exception:
        return None


class SeattleLiveSource(ReportSource):
    mode = "live"

    def __init__(self, url: str, ttl: float = 20.0):
        self.url = url
        self.ttl = ttl
        self._cache: list[Report] | None = None
        self._cache_t = 0.0

    def reset(self) -> None:
        self._cache = None
        self._cache_t = 0.0

    async def _fetch(self) -> list[dict]:
        headers = {"User-Agent": "ResQView/1.0"}
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            resp = await client.get(self.url)
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def _normalize(rows: list[dict]) -> list[Report]:
        parsed = []
        for r in rows:
            cls = classify_seattle(r.get("type"))
            if not cls:
                continue
            lat, lon, ts = r.get("latitude"), r.get("longitude"), _parse_dt(r.get("datetime"))
            if not lat or not lon or ts is None:
                continue
            try:
                lat, lon = float(lat), float(lon)
            except (TypeError, ValueError):
                continue
            if not lat or not lon:
                continue
            cat, base = cls
            parsed.append((ts, r, cat, base, lat, lon))

        reports: list[Report] = []
        if parsed:
            t0 = min(p[0] for p in parsed)
            for ts, r, cat, base, lat, lon in parsed:
                typ = r.get("type", "Incident")
                addr = r.get("address", "unknown location")
                reports.append(Report(
                    id=r.get("incident_number") or f"S{int(ts)}",
                    t=int(ts - t0),
                    source="911",
                    lat=lat, lon=lon,
                    text=f"{typ} reported at {addr}",
                    category=cat, base=base,
                ))
            reports.sort(key=lambda x: x.t)
        return reports

    async def snapshot(self) -> Snapshot:
        now = time.time()
        if self._cache is not None and now - self._cache_t < self.ttl:
            reports = self._cache
        else:
            try:
                rows = await self._fetch()
            except Exception as e:  # network / HTTP / parse — surface as a soft error
                raise SourceError(str(e)) from e
            reports = self._normalize(rows)
            self._cache, self._cache_t = reports, now

        span = max((r.t for r in reports), default=1) or 1
        return Snapshot(
            reports=reports,
            scenario="Live · Seattle Fire & EMS 911",
            center=SEATTLE_CENTER,
            raw_total=len(reports),
            elapsed=span,
            scenario_duration=span,
            feed_complete=False,
        )
