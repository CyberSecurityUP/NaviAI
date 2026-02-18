"""Trusted video recommendation endpoint."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import video_service

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("/trusted")
async def search_trusted_videos(
    q: str = Query(..., min_length=1, description="Search query"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[dict]:
    """Search for trusted video recommendations matching the query.

    Returns a list of curated videos with title, url, channel_name
    and category.
    """
    return await video_service.search_videos(session, query=q, limit=3)
