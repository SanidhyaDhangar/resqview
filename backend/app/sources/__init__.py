"""Pluggable report feeds. Each yields a Snapshot of raw reports + scenario metadata,
so the engine and API never need to know whether the data is scripted or live.
"""
from .base import ReportSource, Snapshot, SourceError
from .registry import get_sources

__all__ = ["ReportSource", "Snapshot", "SourceError", "get_sources"]
