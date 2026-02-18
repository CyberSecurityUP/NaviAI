"""Central registry that maps provider names to their LLM adapter instances."""

from __future__ import annotations

from app.adapters.llm.base_llm import BaseLLMAdapter


class LLMRegistry:
    """Holds registered LLM adapters and provides look-up by provider name."""

    def __init__(self) -> None:
        self._adapters: dict[str, BaseLLMAdapter] = {}

    def register(self, provider: str, adapter: BaseLLMAdapter) -> None:
        """Register an adapter under *provider* (e.g. ``"anthropic"``)."""
        self._adapters[provider] = adapter

    def get(self, provider: str) -> BaseLLMAdapter | None:
        """Return the adapter for *provider*, or ``None`` if not registered."""
        return self._adapters.get(provider)

    def get_default(self) -> BaseLLMAdapter:
        """Return the adapter that matches ``settings.llm_provider``.

        Falls back to the first available adapter if the configured provider
        is not registered.  Raises ``RuntimeError`` when no adapters exist at
        all.
        """
        from app.config import settings

        adapter = self._adapters.get(settings.llm_provider)
        if adapter:
            return adapter

        # Fallback: return any available adapter
        for a in self._adapters.values():
            return a

        raise RuntimeError(
            "No LLM adapters registered. "
            "Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment."
        )

    @property
    def providers(self) -> list[str]:
        """Return the names of all registered providers."""
        return list(self._adapters.keys())
