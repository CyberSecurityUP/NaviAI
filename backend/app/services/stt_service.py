"""Speech-to-text service using OpenAI Whisper API."""

import io

import openai

from app.config import settings


async def transcribe_audio(audio_data: bytes, language: str = "pt-BR") -> str:
    """Transcribe audio bytes using OpenAI's Whisper model.

    Parameters
    ----------
    audio_data:
        Raw audio bytes (e.g. WebM, WAV, MP3).
    language:
        BCP-47 language hint for the transcription model.

    Returns
    -------
    str
        The transcribed text.
    """
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    audio_file = io.BytesIO(audio_data)
    audio_file.name = "audio.webm"

    transcription = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language=language,
    )

    return transcription.text
