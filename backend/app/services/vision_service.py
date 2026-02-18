"""Vision analysis service -- image understanding for elderly users."""

from __future__ import annotations

import logging
import re

from app.adapters.llm.base_llm import LLMRequest
from app.adapters.llm.registry import LLMRegistry
from app.config import settings
from app.i18n import SENSITIVE_PATTERNS, STEP_PATTERNS, t
from app.schemas.vision import VisionResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def analyze_image(
    image_base64: str,
    media_type: str,
    llm_registry: LLMRegistry,
    question: str | None = None,
    locale: str = "pt-BR",
) -> VisionResponse:
    """Analyze an image using a vision-capable LLM.

    Parameters
    ----------
    image_base64:
        Base64-encoded image data.
    media_type:
        MIME type of the image (e.g. ``"image/jpeg"``).
    llm_registry:
        The LLM registry to resolve the adapter from.
    question:
        Optional user question about the image.
    locale:
        Response language locale (``"pt-BR"`` or ``"en"``).

    Returns
    -------
    VisionResponse
        Structured response with description, sensitivity flag, and steps.
    """
    adapter = llm_registry.get_default()

    # Resolve the vision model based on provider
    if adapter.provider_name == "anthropic":
        model = settings.anthropic_vision_model
    elif adapter.provider_name == "openai":
        model = settings.openai_vision_model
    elif adapter.provider_name == "ollama":
        model = settings.ollama_vision_model
    else:
        model = settings.anthropic_vision_model

    user_content = question or t("default_image_question", locale)

    llm_request = LLMRequest(
        messages=[{"role": "user", "content": user_content}],
        model=model,
        system_prompt=t("vision_system_prompt", locale),
        temperature=0.5,
        max_tokens=2048,
        image_base64=image_base64,
        image_media_type=media_type,
    )

    try:
        llm_response = await adapter.complete_vision(llm_request)
    except Exception:
        logger.exception("Vision LLM call failed")
        return VisionResponse(
            description=t("vision_fallback", locale),
            has_sensitive_data=False,
        )

    content = llm_response.content

    # Detect sensitive data mentions (check both locales for safety)
    sensitive_pattern = re.compile(
        SENSITIVE_PATTERNS.get(locale, SENSITIVE_PATTERNS["pt-BR"])
        + "|"
        + SENSITIVE_PATTERNS.get("en" if locale == "pt-BR" else "pt-BR", ""),
        re.IGNORECASE,
    )
    has_sensitive_data = bool(sensitive_pattern.search(content))

    # Extract steps if present
    step_regex = re.compile(
        STEP_PATTERNS.get(locale, STEP_PATTERNS["pt-BR"])
        + "|"
        + STEP_PATTERNS.get("en" if locale == "pt-BR" else "pt-BR", ""),
        re.IGNORECASE,
    )
    steps: list[str] | None = None
    if step_regex.search(content):
        raw_steps = step_regex.split(content)
        steps = [s.strip() for s in raw_steps if s.strip()]

    return VisionResponse(
        description=content,
        has_sensitive_data=has_sensitive_data,
        steps=steps,
    )
