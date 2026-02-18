"""NaviAI FastAPI application entry-point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.db.session import engine, AsyncSessionLocal
from app.models import Base  # noqa: F401  – ensures all models are imported
from app.services import rag_service, video_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Create database tables, initialise FTS5, and seed data on startup."""
    # 1. Create all ORM tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Initialise the FTS5 virtual table for knowledge search
    await rag_service.init_fts(engine)

    # 3. Index knowledge-base markdown files and load trusted videos
    async with AsyncSessionLocal() as session:
        await rag_service.index_knowledge_base(session)
        await video_service.load_trusted_videos(session)

    logger.info("NaviAI startup complete: knowledge base and videos ready")
    yield


app = FastAPI(
    title="NaviAI API",
    version="0.1.0",
    description="AI Assistant for Elderly Users",
    lifespan=lifespan,
)

# ── CORS (allow all origins during development) ──────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────

app.include_router(api_router)


# ── Root health-check ─────────────────────────────────────────────────────


@app.get("/")
async def root() -> dict:
    return {"name": "NaviAI API", "version": "0.1.0"}
