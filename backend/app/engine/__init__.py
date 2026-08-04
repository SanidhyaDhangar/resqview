"""The triage engine: classify -> cluster -> score -> explain.

Pure functions over models; no I/O, no framework. Swap ``classify_report`` for an
LLM call when funded for higher-recall extraction — the contract stays the same.
"""
from .triage import cluster_and_triage

__all__ = ["cluster_and_triage"]
