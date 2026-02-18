"""Internationalization strings for NaviAI backend."""

from __future__ import annotations

from typing import Literal

Locale = Literal["pt-BR", "en"]

DEFAULT_LOCALE: Locale = "pt-BR"

TRANSLATIONS: dict[Locale, dict[str, str]] = {
    "pt-BR": {
        # ── Chat system prompt ────────────────────────────────────────
        "chat_system_prompt": (
            "Voce e o NaviAI, um assistente digital amigavel criado para ajudar "
            "pessoas idosas.\n\n"
            "Regras:\n"
            "- Responda SEMPRE em linguagem simples e clara\n"
            "- Use frases curtas e diretas\n"
            "- Quando explicar um processo, use \"Passo 1:\", \"Passo 2:\", etc.\n"
            "- Nunca use jargao tecnico sem explicar o que significa\n"
            "- Se o usuario perguntar como fazer algo, de instrucoes passo a passo\n"
            "- Seja paciente, carinhoso e respeitoso\n"
            "- Se detectar dados sensiveis (CPF, conta bancaria, senhas), alerte o "
            "usuario\n"
            "- Responda em portugues brasileiro"
        ),
        # ── Vision system prompt ──────────────────────────────────────
        "vision_system_prompt": (
            "Voce e o NaviAI, um assistente visual amigavel criado para ajudar "
            "pessoas idosas a entender imagens.\n\n"
            "Regras:\n"
            "- Descreva a imagem de forma simples e clara\n"
            "- Use frases curtas e diretas\n"
            "- Se a imagem mostrar um processo ou tela, explique passo a passo "
            "usando \"Passo 1:\", \"Passo 2:\", etc.\n"
            "- Nunca use jargao tecnico sem explicar o que significa\n"
            "- Se detectar dados sensiveis na imagem (CPF, conta bancaria, senhas, "
            "numeros de cartao), ALERTE o usuario imediatamente\n"
            "- Responda em portugues brasileiro\n"
            "- Seja paciente, carinhoso e respeitoso"
        ),
        # ── RAG context header ────────────────────────────────────────
        "rag_context_header": (
            "\n\n--- Contexto da base de conhecimento ---\n"
            "Use as informacoes abaixo para responder ao usuario de forma "
            "precisa. Se a pergunta nao estiver relacionada ao contexto, "
            "responda com seu conhecimento geral.\n\n"
        ),
        # ── Fallback / error messages ─────────────────────────────────
        "chat_fallback": (
            "Desculpe, estou com dificuldade para responder agora. "
            "Por favor, tente novamente em alguns instantes."
        ),
        "vision_fallback": (
            "Desculpe, nao consegui analisar a imagem agora. "
            "Por favor, tente novamente em alguns instantes."
        ),
        "default_image_question": "Descreva esta imagem de forma simples e clara.",
        "new_conversation": "Nova conversa",
    },
    "en": {
        # ── Chat system prompt ────────────────────────────────────────
        "chat_system_prompt": (
            "You are NaviAI, a friendly digital assistant designed to help "
            "elderly people.\n\n"
            "Rules:\n"
            "- ALWAYS respond in simple and clear language\n"
            "- Use short and direct sentences\n"
            "- When explaining a process, use \"Step 1:\", \"Step 2:\", etc.\n"
            "- Never use technical jargon without explaining what it means\n"
            "- If the user asks how to do something, give step-by-step instructions\n"
            "- Be patient, kind, and respectful\n"
            "- If you detect sensitive data (SSN, bank account, passwords), "
            "alert the user\n"
            "- Respond in English"
        ),
        # ── Vision system prompt ──────────────────────────────────────
        "vision_system_prompt": (
            "You are NaviAI, a friendly visual assistant designed to help "
            "elderly people understand images.\n\n"
            "Rules:\n"
            "- Describe the image in simple and clear language\n"
            "- Use short and direct sentences\n"
            "- If the image shows a process or screen, explain step by step "
            "using \"Step 1:\", \"Step 2:\", etc.\n"
            "- Never use technical jargon without explaining what it means\n"
            "- If you detect sensitive data in the image (SSN, bank accounts, "
            "passwords, card numbers), ALERT the user immediately\n"
            "- Respond in English\n"
            "- Be patient, kind, and respectful"
        ),
        # ── RAG context header ────────────────────────────────────────
        "rag_context_header": (
            "\n\n--- Knowledge base context ---\n"
            "Use the information below to answer the user accurately. "
            "If the question is not related to the context, "
            "respond with your general knowledge.\n\n"
        ),
        # ── Fallback / error messages ─────────────────────────────────
        "chat_fallback": (
            "Sorry, I'm having trouble responding right now. "
            "Please try again in a few moments."
        ),
        "vision_fallback": (
            "Sorry, I could not analyze the image right now. "
            "Please try again in a few moments."
        ),
        "default_image_question": "Describe this image in simple and clear language.",
        "new_conversation": "New conversation",
    },
}

# Step detection patterns per locale
STEP_PATTERNS: dict[Locale, str] = {
    "pt-BR": r"(?:Passo\s+\d+|Etapa\s+\d+|\d+[\.\)]\s)",
    "en": r"(?:Step\s+\d+|\d+[\.\)]\s)",
}

# Sensitive data patterns per locale
SENSITIVE_PATTERNS: dict[Locale, str] = {
    "pt-BR": (
        r"(?:CPF|senha|senhas|conta\s+bancaria|numero\s+do\s+cartao|"
        r"cartao\s+de\s+credito|dados\s+pessoais|dados\s+sensiveis)"
    ),
    "en": (
        r"(?:SSN|social\s+security|password|passwords|bank\s+account|"
        r"card\s+number|credit\s+card|personal\s+data|sensitive\s+data)"
    ),
}


def t(key: str, locale: Locale | str = DEFAULT_LOCALE) -> str:
    """Get a translated string by key and locale."""
    loc = locale if locale in TRANSLATIONS else DEFAULT_LOCALE
    strings = TRANSLATIONS[loc]  # type: ignore[index]
    return strings.get(key, TRANSLATIONS[DEFAULT_LOCALE].get(key, key))
