"""Chat orchestration service -- the "brain" of NaviAI conversations."""

from __future__ import annotations

import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.llm.base_llm import LLMRequest
from app.adapters.llm.registry import LLMRegistry
from app.config import settings
from app.i18n import STEP_PATTERNS, t
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.schemas.chat import ChatResponse
from app.services import rag_service, video_service

logger = logging.getLogger(__name__)

# Maximum number of conversation history messages to include as context
_MAX_HISTORY_MESSAGES = 20


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def process_message(
    session: AsyncSession,
    user_id: str,
    message: str,
    conversation_id: str | None,
    llm_registry: LLMRegistry,
    locale: str = "pt-BR",
) -> ChatResponse:
    """Process a user message and return an assistant response.

    Steps:
    1. Get or create a conversation.
    2. Persist the user message.
    3. Build the LLM request with conversation history.
    4. Call the default LLM adapter.
    5. Persist the assistant message.
    6. Return a ``ChatResponse``.
    """
    # 1. Get or create conversation ----------------------------------------
    conversation = await _get_or_create_conversation(
        session, user_id, conversation_id, message, locale
    )

    # 2. Save the user message ---------------------------------------------
    user_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.user,
        content=message,
    )
    session.add(user_msg)
    await session.flush()

    # 3. RAG: retrieve relevant knowledge and video suggestions -------------
    rag_chunks = await rag_service.search_knowledge(session, query=message, top_k=3)
    video_suggestions = await video_service.search_videos(session, query=message, limit=2)

    # Build augmented system prompt with RAG context
    system_prompt = t("chat_system_prompt", locale)
    if rag_chunks:
        context_parts = []
        for chunk in rag_chunks:
            context_parts.append(
                f"[{chunk['title']}]\n{chunk['content']}"
            )
        system_prompt += t("rag_context_header", locale) + "\n\n".join(context_parts)

    # 4. Build the LLM request ---------------------------------------------
    history = await _get_conversation_history(session, conversation.id)
    llm_messages = [
        {"role": msg.role.value, "content": msg.content} for msg in history
    ]

    adapter = llm_registry.get_default()

    # Resolve model name based on provider
    if adapter.provider_name == "anthropic":
        model = settings.anthropic_model
    elif adapter.provider_name == "openai":
        model = settings.openai_model
    elif adapter.provider_name == "ollama":
        model = settings.ollama_model
    else:
        model = settings.anthropic_model

    llm_request = LLMRequest(
        messages=llm_messages,
        model=model,
        system_prompt=system_prompt,
        temperature=0.7,
        max_tokens=2048,
    )

    # 5. Call the LLM -------------------------------------------------------
    try:
        llm_response = await adapter.complete(llm_request)
    except Exception:
        logger.exception("LLM completion failed")
        fallback_text = t("chat_fallback", locale)
        assistant_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.assistant,
            content=fallback_text,
        )
        session.add(assistant_msg)
        await session.commit()
        return ChatResponse(
            message=fallback_text,
            conversation_id=conversation.id,
            has_steps=False,
        )

    # 6. Save the assistant message -----------------------------------------
    assistant_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.assistant,
        content=llm_response.content,
        model_provider=llm_response.model_provider,
        model_name=llm_response.model_name,
    )
    session.add(assistant_msg)
    await session.commit()

    # 7. Build and return the response --------------------------------------
    step_pattern = re.compile(STEP_PATTERNS.get(locale, STEP_PATTERNS["pt-BR"]), re.IGNORECASE)
    has_steps = bool(step_pattern.search(llm_response.content))

    # Include first matching video as suggestion, and RAG sources
    suggested_video = video_suggestions[0] if video_suggestions else None
    sources = (
        [{"title": c["title"], "source": c["source"]} for c in rag_chunks]
        if rag_chunks
        else None
    )

    return ChatResponse(
        message=llm_response.content,
        conversation_id=conversation.id,
        has_steps=has_steps,
        suggested_video=suggested_video,
        sources=sources,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_or_create_conversation(
    session: AsyncSession,
    user_id: str,
    conversation_id: str | None,
    first_message: str,
    locale: str = "pt-BR",
) -> Conversation:
    """Return an existing conversation or create a new one."""
    if conversation_id:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation:
            return conversation
        logger.warning(
            "Conversation %s not found for user %s; creating new one",
            conversation_id,
            user_id,
        )

    title = first_message[:80].strip() or t("new_conversation", locale)
    conversation = Conversation(user_id=user_id, title=title)
    session.add(conversation)
    await session.flush()
    return conversation


async def _get_conversation_history(
    session: AsyncSession,
    conversation_id: str,
) -> list[Message]:
    """Load the last N messages for context."""
    result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = list(result.scalars().all())

    if len(messages) > _MAX_HISTORY_MESSAGES:
        messages = messages[-_MAX_HISTORY_MESSAGES:]

    return messages
