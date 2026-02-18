"""Auth-related request and response schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Payload for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Payload for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token pair returned after login or refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public representation of a user."""

    id: str
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RefreshRequest(BaseModel):
    """Payload for token refresh."""

    refresh_token: str


class AccessibilitySettingsUpdate(BaseModel):
    """Payload for updating accessibility settings."""

    accessibility_settings: dict
