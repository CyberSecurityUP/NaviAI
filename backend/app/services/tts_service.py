"""Text-to-speech service using the edge-tts library."""

import edge_tts

# Voice mapping per language code.
_VOICE_MAP: dict[str, str] = {
    "pt-BR": "pt-BR-AntonioNeural",
    "en": "en-US-GuyNeural",
}

_DEFAULT_VOICE = "pt-BR-AntonioNeural"


async def synthesize_speech(text: str, language: str = "pt-BR") -> bytes:
    """Synthesize *text* into MP3 audio bytes.

    Parameters
    ----------
    text:
        The text to convert to speech.
    language:
        Language code used to select the TTS voice.

    Returns
    -------
    bytes
        Raw MP3 audio data.
    """
    voice = _VOICE_MAP.get(language, _DEFAULT_VOICE)

    communicate = edge_tts.Communicate(text, voice)

    audio_bytes = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes += chunk["data"]

    return audio_bytes
