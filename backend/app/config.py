"""Application settings, sourced from env vars (prefix ``RESQVIEW_``) or a .env file."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ — the package's parent, so data/ resolves regardless of CWD.
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="RESQVIEW_", env_file=".env", extra="ignore")

    # Scenario replay: compress a ~125s feed into ~50s of wall-clock.
    time_scale: float = 2.5

    # Live source (Seattle Real-Time Fire 911, Socrata open data, no key needed).
    seattle_url: str = (
        "https://data.seattle.gov/resource/kzjm-xkqj.json"
        "?$limit=120&$order=datetime%20DESC"
    )
    live_ttl: float = 20.0  # cache live pulls briefly: be a good API citizen

    # Where the scripted Mumbai scenario lives.
    data_path: str = str(BASE_DIR / "data" / "reports.json")

    # Frontend dev origins allowed through CORS.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


@lru_cache
def get_settings() -> Settings:
    """Cached singleton so sources keep their state across requests."""
    return Settings()
