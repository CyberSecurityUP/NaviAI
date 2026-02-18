"""Authentication endpoints: register, login, refresh, profile."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.middleware.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AccessibilitySettingsUpdate,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── POST /auth/register ──────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    body: RegisterRequest,
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """Create a new user account."""
    # Check for existing email
    result = await session.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ── POST /auth/login ─────────────────────────────────────────────────────


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_async_session),
) -> TokenResponse:
    """Authenticate a user and return a JWT token pair."""
    result = await session.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


# ── POST /auth/refresh ───────────────────────────────────────────────────


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    session: AsyncSession = Depends(get_async_session),
) -> TokenResponse:
    """Exchange a valid refresh token for a new token pair."""
    payload = decode_token(body.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type; expected refresh token",
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    # Verify the user still exists
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user."""
    return current_user


# ── PATCH /auth/me/accessibility ──────────────────────────────────────────


@router.patch("/me/accessibility", response_model=UserResponse)
async def update_accessibility(
    body: AccessibilitySettingsUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """Update the authenticated user's accessibility settings."""
    current_user.accessibility_settings = json.dumps(body.accessibility_settings)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


# ── GET /auth/oauth/google ────────────────────────────────────────────


@router.get("/oauth/google")
async def oauth_google_redirect() -> dict:
    """Return the Google OAuth2 authorization URL."""
    from app.config import settings as _settings

    if not _settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env",
        )

    from app.services.oauth_service import get_google_auth_url
    return {"url": get_google_auth_url()}


# ── POST /auth/oauth/google/callback ──────────────────────────────────


@router.post("/oauth/google/callback", response_model=TokenResponse)
async def oauth_google_callback(
    code: str,
    session: AsyncSession = Depends(get_async_session),
) -> TokenResponse:
    """Exchange a Google OAuth2 authorization code for NaviAI tokens.

    Creates the user if they don't exist yet (social login auto-registration).
    """
    from app.services.oauth_service import exchange_google_code

    try:
        user_info = await exchange_google_code(code)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate with Google",
        )

    # Find or create user
    result = await session.execute(select(User).where(User.email == user_info.email))
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-register via OAuth -- use a random password hash since they'll login via Google
        user = User(
            email=user_info.email,
            password_hash=hash_password(uuid.uuid4().hex),
            display_name=user_info.name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


# ── POST /auth/dev-session ───────────────────────────────────────────────


@router.post("/dev-session", response_model=TokenResponse)
async def dev_session(
    session: AsyncSession = Depends(get_async_session),
) -> TokenResponse:
    """Create or reuse a dev test user and return tokens.

    Only available when DEV_MODE=true. Creates a user with
    email dev@naviai.local if it doesn't exist.
    """
    from app.config import settings

    if not settings.dev_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev session is only available in dev mode",
        )

    dev_email = "dev@naviai.local"
    result = await session.execute(select(User).where(User.email == dev_email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=dev_email,
            password_hash=hash_password("devpassword123"),
            display_name="Dev User",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )
