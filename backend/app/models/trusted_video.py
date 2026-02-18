"""TrustedVideo model -- curated video recommendations for elderly users."""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin


class TrustedVideo(Base, IDMixin):
    """A curated, trusted video recommendation."""

    __tablename__ = "trusted_videos"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    channel_name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    keywords: Mapped[str] = mapped_column(Text)  # comma-separated
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
