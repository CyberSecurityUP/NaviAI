"""Message model."""

import enum

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class MessageRole(str, enum.Enum):
    """Allowed message roles."""

    user = "user"
    assistant = "assistant"
    system = "system"


class Message(Base, IDMixin, TimestampMixin):
    """A single message within a conversation."""

    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[MessageRole] = mapped_column(
        Enum(MessageRole), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model_provider: Mapped[str | None] = mapped_column(
        String(50), nullable=True, default=None
    )
    model_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, default=None
    )
    has_image: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    metadata_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, default=None
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(  # noqa: F821
        "Conversation", back_populates="messages"
    )

    def __repr__(self) -> str:
        return f"<Message id={self.id!r} role={self.role!r}>"
