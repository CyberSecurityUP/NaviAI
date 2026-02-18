"""KnowledgeChunk model -- stores indexed chunks from knowledge-base markdown files."""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin


class KnowledgeChunk(Base, IDMixin):
    """A chunk of text extracted from a knowledge-base markdown document."""

    __tablename__ = "knowledge_chunks"

    source_file: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(500))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer)
    keywords: Mapped[str | None] = mapped_column(Text)  # comma-separated
