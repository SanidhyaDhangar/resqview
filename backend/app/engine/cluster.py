"""Step 2 — collapse nearby same-category reports into clusters (deduplication)."""
from __future__ import annotations

from math import atan2, cos, radians, sin, sqrt

from .categories import CLUSTER_RADIUS_M
from .classify import Classified


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in metres."""
    R = 6371000.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dlam / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def cluster(classified: list[Classified], radius: float = CLUSTER_RADIUS_M) -> list[list[Classified]]:
    """Greedy single-pass clustering keyed on (category, proximity to cluster head)."""
    clusters: list[list[Classified]] = []
    for c in classified:
        for cl in clusters:
            head = cl[0]
            if head.category == c.category and haversine_m(head.lat, head.lon, c.lat, c.lon) <= radius:
                cl.append(c)
                break
        else:
            clusters.append([c])
    return clusters
