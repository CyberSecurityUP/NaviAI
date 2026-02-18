"""Speech-to-text endpoint -- audio transcription fallback."""

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.stt import TranscriptionResponse
from app.services import stt_service

router = APIRouter(prefix="/stt", tags=["stt"])


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("pt-BR"),
    current_user: User = Depends(get_current_user),
) -> TranscriptionResponse:
    """Transcribe an uploaded audio file using OpenAI Whisper.

    Returns the transcribed text together with the language that was used.
    """
    audio_data = await audio.read()

    text = await stt_service.transcribe_audio(audio_data, language=language)

    return TranscriptionResponse(text=text, language=language)
