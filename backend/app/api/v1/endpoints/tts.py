"""Text-to-speech endpoint -- audio synthesis fallback."""

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.tts import TTSRequest
from app.services import tts_service

router = APIRouter(prefix="/tts", tags=["tts"])


@router.post("/synthesize")
async def synthesize(
    body: TTSRequest,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Synthesize speech from the provided text.

    Returns raw MP3 audio bytes with ``audio/mpeg`` content type.
    """
    audio_bytes = await tts_service.synthesize_speech(
        text=body.text,
        language=body.language,
    )

    return Response(content=audio_bytes, media_type="audio/mpeg")
