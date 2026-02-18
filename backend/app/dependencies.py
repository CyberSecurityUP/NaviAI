"""FastAPI-level dependencies shared across routers."""

from __future__ import annotations

import logging
from functools import lru_cache

from app.adapters.llm.anthropic_adapter import AnthropicAdapter
from app.adapters.llm.openai_adapter import OpenAIAdapter
from app.adapters.llm.registry import LLMRegistry
from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache
def get_llm_registry() -> LLMRegistry:
    """Build and cache the LLM registry based on available API keys.

    Called once per process thanks to ``@lru_cache``.  The returned
    :class:`LLMRegistry` is then injected via ``Depends(get_llm_registry)``
    in endpoint handlers.
    """
    registry = LLMRegistry()

    if settings.anthropic_api_key:
        registry.register(
            "anthropic",
            AnthropicAdapter(api_key=settings.anthropic_api_key),
        )
        logger.info("Registered Anthropic LLM adapter")

    if settings.openai_api_key:
        registry.register(
            "openai",
            OpenAIAdapter(api_key=settings.openai_api_key),
        )
        logger.info("Registered OpenAI LLM adapter")

    # Ollama is always available if the server is running (no API key needed)
    if settings.llm_provider == "ollama" or (not registry.providers):
        try:
            from app.adapters.llm.ollama_adapter import OllamaAdapter
            vision_url = settings.ollama_vision_base_url
            registry.register(
                "ollama",
                OllamaAdapter(
                    base_url=settings.ollama_base_url,
                    vision_base_url=vision_url if vision_url != settings.ollama_base_url else None,
                ),
            )
            logger.info(
                "Registered Ollama LLM adapter (chat=%s, vision=%s)",
                settings.ollama_base_url,
                vision_url,
            )
        except Exception as e:
            logger.warning("Failed to register Ollama adapter: %s", e)

    if not registry.providers:
        logger.warning(
            "No LLM API keys configured. "
            "Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file."
        )

    return registry
