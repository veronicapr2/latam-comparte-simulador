from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path


def _load_env_file() -> None:
    """Load backend/.env without requiring an extra dependency."""
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class Settings:
    def __init__(self) -> None:
        _load_env_file()
        self.app_name = os.getenv("APP_NAME", "Colombia Comparte Simulator")
        self.env = os.getenv("ENV", "development")
        origins = os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        )
        self.allowed_origins = [origin.strip() for origin in origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
