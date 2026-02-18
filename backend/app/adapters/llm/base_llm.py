"""Abstract base class for LLM provider adapters."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class LLMRequest:
    """Encapsulates all parameters for a single LLM call."""

    messages: list[dict]  # [{"role": "user", "content": "..."}]
    model: str
    temperature: float = 0.7
    max_tokens: int = 2048
    system_prompt: str | None = None
    stream: bool = False
    image_base64: str | None = None
    image_media_type: str | None = None  # e.g. "image/jpeg"


@dataclass
class LLMResponse:
    """Standard response envelope from any LLM adapter."""

    content: str
    model_provider: str
    model_name: str
    tokens_input: int = 0
    tokens_output: int = 0


class BaseLLMAdapter(ABC):
    """Contract that every LLM provider adapter must implement."""

    provider_name: str

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a text-only completion request and return the full response."""
        ...

    @abstractmethod
    async def complete_vision(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request that includes an image and return the
        full response."""
        ...

    @abstractmethod
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream text deltas back to the caller."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return ``True`` when the upstream provider is reachable."""
        ...
