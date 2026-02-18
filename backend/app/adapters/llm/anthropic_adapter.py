"""Anthropic (Claude) adapter using the official ``anthropic`` Python SDK."""

from __future__ import annotations

import logging
from typing import AsyncIterator

import anthropic

from app.adapters.llm.base_llm import BaseLLMAdapter, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for the Anthropic Messages API."""

    provider_name: str = "anthropic"

    def __init__(self, api_key: str) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    # ------------------------------------------------------------------
    # Text completion
    # ------------------------------------------------------------------

    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Perform a standard text completion."""
        kwargs = self._build_kwargs(request)
        response = await self._client.messages.create(**kwargs)

        return LLMResponse(
            content=response.content[0].text,
            model_provider=self.provider_name,
            model_name=request.model,
            tokens_input=response.usage.input_tokens,
            tokens_output=response.usage.output_tokens,
        )

    # ------------------------------------------------------------------
    # Vision completion
    # ------------------------------------------------------------------

    async def complete_vision(self, request: LLMRequest) -> LLMResponse:
        """Perform a completion that includes an image."""
        if not request.image_base64 or not request.image_media_type:
            raise ValueError(
                "complete_vision requires image_base64 and image_media_type"
            )

        # Build the vision-augmented message list
        messages = list(request.messages)  # shallow copy
        image_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": request.image_media_type,
                "data": request.image_base64,
            },
        }

        # Append image to the last user message or create a new one
        if messages and messages[-1]["role"] == "user":
            last_msg = messages[-1]
            # Convert string content to list of content blocks
            if isinstance(last_msg["content"], str):
                last_msg["content"] = [
                    {"type": "text", "text": last_msg["content"]},
                    image_block,
                ]
            else:
                last_msg["content"].append(image_block)
        else:
            messages.append(
                {"role": "user", "content": [image_block]}
            )

        vision_request = LLMRequest(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
        )

        kwargs = self._build_kwargs(vision_request)
        response = await self._client.messages.create(**kwargs)

        return LLMResponse(
            content=response.content[0].text,
            model_provider=self.provider_name,
            model_name=request.model,
            tokens_input=response.usage.input_tokens,
            tokens_output=response.usage.output_tokens,
        )

    # ------------------------------------------------------------------
    # Streaming
    # ------------------------------------------------------------------

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Yield text deltas from the Anthropic streaming API."""
        kwargs = self._build_kwargs(request)
        async with self._client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------

    async def health_check(self) -> bool:
        """Verify we can reach the Anthropic API with a tiny request."""
        try:
            response = await self._client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return bool(response.content)
        except Exception:
            logger.exception("Anthropic health-check failed")
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_kwargs(request: LLMRequest) -> dict:
        """Translate an ``LLMRequest`` into ``messages.create()`` kwargs."""
        kwargs: dict = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "messages": request.messages,
        }
        if request.system_prompt:
            kwargs["system"] = request.system_prompt
        return kwargs
