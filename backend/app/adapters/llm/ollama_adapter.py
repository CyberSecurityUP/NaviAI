"""Ollama adapter -- local LLM via OpenAI-compatible API."""

from __future__ import annotations

import logging
from typing import AsyncIterator

import openai

from app.adapters.llm.base_llm import BaseLLMAdapter, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class OllamaAdapter(BaseLLMAdapter):
    """Adapter for local Ollama models via OpenAI-compatible endpoint."""

    provider_name: str = "ollama"

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        vision_base_url: str | None = None,
    ) -> None:
        self._client = openai.AsyncOpenAI(
            base_url=f"{base_url}/v1",
            api_key="ollama",  # Ollama doesn't need a real key
        )
        self._base_url = base_url
        # Vision can live on a separate Ollama instance (e.g. Docker container)
        vision_url = vision_base_url or base_url
        self._vision_client = openai.AsyncOpenAI(
            base_url=f"{vision_url}/v1",
            api_key="ollama",
        )

    async def complete(self, request: LLMRequest) -> LLMResponse:
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

    async def complete_vision(self, request: LLMRequest) -> LLMResponse:
        if not request.image_base64 or not request.image_media_type:
            raise ValueError("complete_vision requires image_base64 and image_media_type")

        messages = self._build_messages(request)
        image_url_block = {
            "type": "image_url",
            "image_url": {
                "url": f"data:{request.image_media_type};base64,{request.image_base64}",
            },
        }
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
            messages.append({"role": "user", "content": [image_url_block]})

        response = await self._vision_client.chat.completions.create(
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

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
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

    async def health_check(self) -> bool:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{self._base_url}/api/tags", timeout=5.0)
                return resp.status_code == 200
        except Exception:
            logger.warning("Ollama health-check failed (is Ollama running?)")
            return False

    @staticmethod
    def _build_messages(request: LLMRequest) -> list[dict]:
        messages: list[dict] = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.extend(request.messages)
        return messages
