"""Import all models so Alembic and SQLAlchemy can discover them."""

from app.models.base import Base, IDMixin, TimestampMixin
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.trusted_video import TrustedVideo

__all__ = [
    "Base",
    "IDMixin",
    "TimestampMixin",
    "User",
    "Conversation",
    "Message",
    "KnowledgeChunk",
    "TrustedVideo",
]
