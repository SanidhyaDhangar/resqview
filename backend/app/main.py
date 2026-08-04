"""FastAPI application assembly.

Dev:  uvicorn app.main:app --reload   (frontend runs separately on Vite :5173)
Prod: build the frontend (``npm run build``) and this server also serves it.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .routers import health, incidents

settings = get_settings()

app = FastAPI(
    title="ResQView API",
    version="1.0.0",
    description="Crisis triage: classify -> cluster -> score -> explain. Decision-support only.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")

# If the frontend has been built, serve it from the same origin (single-process prod).
_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="frontend")
