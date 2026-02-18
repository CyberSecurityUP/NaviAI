"""RAG (Retrieval-Augmented Generation) service using SQLite FTS5 full-text search."""

from __future__ import annotations

import logging
from pathlib import Path

import frontmatter
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.config import settings
from app.models.knowledge_chunk import KnowledgeChunk

logger = logging.getLogger(__name__)

# Target chunk size in characters, with overlap for context continuity
_CHUNK_SIZE = 500
_CHUNK_OVERLAP = 100


# ---------------------------------------------------------------------------
# FTS5 virtual table management
# ---------------------------------------------------------------------------


async def init_fts(engine: AsyncEngine) -> None:
    """Create the FTS5 virtual table that mirrors knowledge_chunks.

    This is called once at application startup.  The FTS5 virtual table
    enables fast full-text search on chunk content, titles and keywords.
    """
    async with engine.begin() as conn:
        # Create FTS5 virtual table if it doesn't already exist
        await conn.execute(
            text(
                "CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts "
                "USING fts5(chunk_id, title, content, keywords)"
            )
        )
    logger.info("FTS5 virtual table ready")


async def _rebuild_fts(session: AsyncSession) -> None:
    """Rebuild the FTS5 index from the knowledge_chunks table."""
    await session.execute(text("DELETE FROM knowledge_chunks_fts"))
    await session.execute(
        text(
            "INSERT INTO knowledge_chunks_fts (chunk_id, title, content, keywords) "
            "SELECT id, title, content, COALESCE(keywords, '') FROM knowledge_chunks"
        )
    )
    await session.commit()
    logger.info("FTS5 index rebuilt")


# ---------------------------------------------------------------------------
# Knowledge-base indexing
# ---------------------------------------------------------------------------


def _chunk_text(text_body: str, chunk_size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks of roughly *chunk_size* characters.

    Splits on paragraph boundaries (double newlines) when possible, then
    falls back to sentence-level splitting to avoid cutting mid-word.
    """
    if len(text_body) <= chunk_size:
        return [text_body.strip()] if text_body.strip() else []

    chunks: list[str] = []
    start = 0
    length = len(text_body)

    while start < length:
        end = min(start + chunk_size, length)

        # If not at the end, try to find a good break point
        if end < length:
            # Try paragraph break first
            para_break = text_body.rfind("\n\n", start, end)
            if para_break > start:
                end = para_break + 2  # include the double-newline
            else:
                # Try sentence break
                for sep in (". ", ".\n", "! ", "? "):
                    sent_break = text_body.rfind(sep, start, end)
                    if sent_break > start:
                        end = sent_break + len(sep)
                        break

        chunk = text_body[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start forward with overlap
        start = max(start + 1, end - overlap)

    return chunks


async def index_knowledge_base(session: AsyncSession) -> None:
    """Read all markdown files from the knowledge base directory and index them.

    Files already indexed (based on source_file name) are skipped, so this
    is safe to call on every startup.
    """
    kb_dir = Path(settings.knowledge_base_dir)
    if not kb_dir.exists():
        logger.warning("Knowledge base directory not found: %s", kb_dir)
        return

    md_files = sorted(kb_dir.glob("*.md"))
    if not md_files:
        logger.info("No markdown files found in %s", kb_dir)
        return

    # Determine which files are already indexed
    result = await session.execute(
        select(KnowledgeChunk.source_file).distinct()
    )
    indexed_files: set[str] = {row[0] for row in result.all()}

    new_count = 0
    for md_path in md_files:
        filename = md_path.name
        if filename in indexed_files:
            logger.debug("Skipping already-indexed file: %s", filename)
            continue

        try:
            post = frontmatter.load(str(md_path))
        except Exception:
            logger.exception("Failed to parse frontmatter from %s", filename)
            continue

        title = post.get("title", filename)
        keywords = post.get("keywords", "")

        # Chunk the content body
        chunks = _chunk_text(post.content)

        for idx, chunk_text in enumerate(chunks):
            chunk = KnowledgeChunk(
                source_file=filename,
                title=title,
                content=chunk_text,
                chunk_index=idx,
                keywords=keywords,
            )
            session.add(chunk)
            new_count += 1

    if new_count:
        await session.commit()
        logger.info("Indexed %d new chunks from %d files", new_count, len(md_files) - len(indexed_files))

        # Rebuild the FTS index to include new data
        await _rebuild_fts(session)
    else:
        logger.info("Knowledge base already up-to-date; no new files to index")


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


async def search_knowledge(
    session: AsyncSession,
    query: str,
    top_k: int = 3,
) -> list[dict]:
    """Search the knowledge base using FTS5 MATCH.

    Returns a list of dicts with keys: ``title``, ``content``, ``source``.
    """
    if not query or not query.strip():
        return []

    # Sanitize query for FTS5: remove special characters, keep words
    clean_words = []
    for word in query.split():
        sanitized = "".join(ch for ch in word if ch.isalnum())
        if sanitized:
            clean_words.append(sanitized)

    if not clean_words:
        return []

    # Use OR between words so partial matches are included
    fts_query = " OR ".join(clean_words)

    try:
        result = await session.execute(
            text(
                "SELECT chunk_id, title, content, "
                "rank "
                "FROM knowledge_chunks_fts "
                "WHERE knowledge_chunks_fts MATCH :query "
                "ORDER BY rank "
                "LIMIT :limit"
            ),
            {"query": fts_query, "limit": top_k},
        )
        rows = result.all()
    except Exception:
        logger.exception("FTS5 search failed for query: %s", query)
        return []

    return [
        {
            "title": row[1],
            "content": row[2],
            "source": row[1],  # use title as human-readable source
        }
        for row in rows
    ]
