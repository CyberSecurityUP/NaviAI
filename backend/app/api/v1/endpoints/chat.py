"""Chat endpoint -- processes user messages through the LLM pipeline."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.llm.registry import LLMRegistry
from app.db.session import get_async_session
from app.dependencies import get_llm_registry
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
    llm_registry: LLMRegistry = Depends(get_llm_registry),
) -> ChatResponse:
    """Send a message and receive the NaviAI assistant response.

    If ``conversation_id`` is omitted a new conversation is created
    automatically.
    """
    if not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty",
        )

    return await chat_service.process_message(
        session=session,
        user_id=current_user.id,
        message=body.message,
        conversation_id=body.conversation_id,
        llm_registry=llm_registry,
        locale=body.locale,
    )
