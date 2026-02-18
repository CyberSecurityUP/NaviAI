"""Conversation model."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class Conversation(Base, IDMixin, TimestampMixin):
    """A chat conversation belonging to a user."""

    __tablename__ = "conversations"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False, default="New Conversation")

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="conversations"
    )
    messages: Mapped[list["Message"]] = relationship(  # noqa: F821
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    def __repr__(self) -> str:
        return f"<Conversation id={self.id!r} title={self.title!r}>"
