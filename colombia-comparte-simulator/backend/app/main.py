from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import router
from app.core.config import get_settings
from app.core.cors import configure_cors


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="API REST para simular recorridos de usuarios de Colombia Comparte con cadenas de Markov.",
    version="1.0.0",
)

configure_cors(app)
app.include_router(router)


@app.get("/")
def root() -> dict:
    return {
        "message": settings.app_name,
        "docs": "/docs",
        "health": "/api/health",
    }
