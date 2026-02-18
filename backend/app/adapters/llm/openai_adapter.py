"""OpenAI adapter using the official ``openai`` Python SDK."""

from __future__ import annotations

import logging
from typing import AsyncIterator

import openai

from app.adapters.llm.base_llm import BaseLLMAdapter, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for the OpenAI Chat Completions API."""

    provider_name: str = "openai"

    def __init__(self, api_key: str) -> None:
        self._client = openai.AsyncOpenAI(api_key=api_key)

    # ------------------------------------------------------------------
    # Text completion
    # ------------------------------------------------------------------

    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Perform a standard text completion."""
        messages = self._build_messages(request)
        response = await self._client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        choice = response.choices[0]
        usage = response.usage

        return LLMResponse(
            content=choice.message.content or "",
            model_provider=self.provider_name,
            model_name=request.model,
            tokens_input=usage.prompt_tokens if usage else 0,
            tokens_output=usage.completion_tokens if usage else 0,
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

        messages = self._build_messages(request)

        image_url_block = {
            "type": "image_url",
            "image_url": {
                "url": f"data:{request.image_media_type};base64,{request.image_base64}",
            },
        }

        # Append image to the last user message or create a new one
        if messages and messages[-1]["role"] == "user":
            last_msg = messages[-1]
            if isinstance(last_msg["content"], str):
                last_msg["content"] = [
                    {"type": "text", "text": last_msg["content"]},
                    image_url_block,
                ]
            else:
                last_msg["content"].append(image_url_block)
        else:
            messages.append(
                {"role": "user", "content": [image_url_block]}
            )

        response = await self._client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        choice = response.choices[0]
        usage = response.usage

        return LLMResponse(
            content=choice.message.content or "",
            model_provider=self.provider_name,
            model_name=request.model,
            tokens_input=usage.prompt_tokens if usage else 0,
            tokens_output=usage.completion_tokens if usage else 0,
        )

    # ------------------------------------------------------------------
    # Streaming
    # ------------------------------------------------------------------

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Yield text deltas from the OpenAI streaming API."""
        messages = self._build_messages(request)
        response = await self._client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )

        async for chunk in response:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta and delta.content:
                yield delta.content

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------

    async def health_check(self) -> bool:
        """Verify we can reach the OpenAI API with a tiny request."""
        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return bool(response.choices)
        except Exception:
            logger.exception("OpenAI health-check failed")
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_messages(request: LLMRequest) -> list[dict]:
        """Prepend the system message (if any) to the conversation list."""
        messages: list[dict] = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.extend(request.messages)
        return messages
