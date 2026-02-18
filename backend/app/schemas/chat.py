"""Chat-related request and response schemas."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Payload for sending a chat message."""

    message: str
    conversation_id: str | None = None
    locale: str = "pt-BR"


class ChatResponse(BaseModel):
    """Response from the chat endpoint."""

    message: str
    conversation_id: str
    has_steps: bool = False
    suggested_video: dict | None = None
    sources: list[dict] | None = None
