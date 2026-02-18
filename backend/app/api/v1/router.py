"""Aggregate API v1 router."""

from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.vision import router as vision_router
from app.api.v1.endpoints.knowledge import router as knowledge_router
from app.api.v1.endpoints.videos import router as videos_router
from app.api.v1.endpoints.stt import router as stt_router
from app.api.v1.endpoints.tts import router as tts_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(vision_router)
api_router.include_router(knowledge_router)
api_router.include_router(videos_router)
api_router.include_router(stt_router)
api_router.include_router(tts_router)
