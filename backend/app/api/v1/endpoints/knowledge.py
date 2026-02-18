"""Knowledge base search endpoint."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import rag_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/search")
async def search_knowledge(
    q: str = Query(..., min_length=1, description="Search query"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[dict]:
    """Search the knowledge base for relevant content.

    Returns a list of matching chunks with title, content and source.
    """
    return await rag_service.search_knowledge(session, query=q, top_k=5)
