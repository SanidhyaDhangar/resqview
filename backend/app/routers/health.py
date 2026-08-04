"""Liveness / readiness endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from .. import __version__

router = APIRouter(tags=["meta"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "resqview-api", "version": __version__}
