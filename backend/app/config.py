"""Application configuration loaded from environment variables and .env file."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the NaviAI backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./data/naviai.db"

    # ── Auth / JWT ────────────────────────────────────────────────────────
    secret_key: str = "CHANGE-ME-in-production-use-a-real-secret"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"

    # ── LLM provider ─────────────────────────────────────────────────────
    llm_provider: str = "anthropic"

    anthropic_api_key: str = ""
    openai_api_key: str = ""

    anthropic_model: str = "claude-sonnet-4-20250514"
    openai_model: str = "gpt-4o"
    anthropic_vision_model: str = "claude-sonnet-4-20250514"
    openai_vision_model: str = "gpt-4o"

    # ── Ollama (local models) ──────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    ollama_vision_base_url: str = "http://localhost:11435"
    ollama_model: str = "llama3.2"
    ollama_vision_model: str = "llava"

    # ── Google OAuth ───────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/auth/callback/google"

    # ── Dev mode ───────────────────────────────────────────────────────
    dev_mode: bool = True  # When True, allows auto-login with dev session

    # ── Knowledge base ────────────────────────────────────────────────────
    knowledge_base_dir: str = str(Path("data/knowledge_base"))
    trusted_videos_path: str = str(Path("data/trusted_videos.yaml"))


settings = Settings()
