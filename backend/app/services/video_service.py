"""Trusted video recommendation service."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.trusted_video import TrustedVideo

logger = logging.getLogger(__name__)

# Path to the seed data file
_DEFAULT_VIDEOS_PATH = Path("data/trusted_videos.json")


# ---------------------------------------------------------------------------
# Loading seed data
# ---------------------------------------------------------------------------


async def load_trusted_videos(session: AsyncSession) -> None:
    """Load videos from the JSON seed file into the database.

    Skips loading if the ``trusted_videos`` table already contains rows,
    making it safe to call on every startup.
    """
    # Check if videos are already loaded
    result = await session.execute(select(TrustedVideo.id).limit(1))
    if result.scalar_one_or_none() is not None:
        logger.info("Trusted videos already loaded; skipping seed")
        return

    # Resolve the path -- try settings first, fall back to default
    videos_path = Path(settings.trusted_videos_path)
    if not videos_path.exists() or not videos_path.suffix == ".json":
        videos_path = _DEFAULT_VIDEOS_PATH

    if not videos_path.exists():
        logger.warning("Trusted videos file not found: %s", videos_path)
        return

    try:
        with open(videos_path, "r", encoding="utf-8") as f:
            video_data = json.load(f)
    except Exception:
        logger.exception("Failed to read trusted videos file: %s", videos_path)
        return

    count = 0
    for item in video_data:
        video = TrustedVideo(
            title=item["title"],
            url=item["url"],
            channel_name=item.get("channel_name", ""),
            category=item.get("category", ""),
            keywords=item.get("keywords", ""),
            is_verified=item.get("is_verified", True),
        )
        session.add(video)
        count += 1

    await session.commit()
    logger.info("Loaded %d trusted videos from %s", count, videos_path)


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


async def search_videos(
    session: AsyncSession,
    query: str,
    limit: int = 2,
) -> list[dict]:
    """Find matching trusted videos by keyword overlap.

    Performs a simple keyword matching: each word from the user query is
    compared against the comma-separated keywords of every video.  Videos
    are ranked by the number of matching keywords.

    Returns a list of dicts with keys: ``title``, ``url``,
    ``channel_name``, ``category``.
    """
    if not query or not query.strip():
        return []

    # Normalise query words
    query_words = {
        word.lower().strip()
        for word in query.split()
        if len(word.strip()) > 2  # skip very short words
    }

    if not query_words:
        return []

    # Fetch all verified videos
    result = await session.execute(
        select(TrustedVideo).where(TrustedVideo.is_verified.is_(True))
    )
    videos = result.scalars().all()

    # Score each video
    scored: list[tuple[int, TrustedVideo]] = []
    for video in videos:
        video_keywords = {
            kw.strip().lower() for kw in video.keywords.split(",") if kw.strip()
        }
        # Also include words from the title and category
        title_words = {w.lower() for w in video.title.split() if len(w) > 2}
        video_keywords |= title_words
        video_keywords.add(video.category.lower())

        # Count how many query words match video keywords
        overlap = len(query_words & video_keywords)

        # Also count partial matches (query word is a substring of a keyword)
        for qw in query_words:
            for vk in video_keywords:
                if qw in vk or vk in qw:
                    overlap += 1

        if overlap > 0:
            scored.append((overlap, video))

    # Sort by score descending and take the top `limit`
    scored.sort(key=lambda pair: pair[0], reverse=True)

    return [
        {
            "title": video.title,
            "url": video.url,
            "channel_name": video.channel_name,
            "category": video.category,
        }
        for _, video in scored[:limit]
    ]
