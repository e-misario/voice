"""
Pruebas unitarias para el microservicio y wrapper de VoiceStudio (debpalash/VoiceStudio).
"""
import base64
import pytest
from app.services.voice_studio import VoiceStudioService, voice_studio_service


@pytest.mark.asyncio
async def test_voice_clone_creation():
    """Verifica que el proceso de clonación reciba muestras de audio y genere un voice_id."""
    fake_audio_bytes = b"RIFF____WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    
    result = await voice_studio_service.clone_voice(
        audio_content=fake_audio_bytes,
        voice_name="Voz Corporativa CEO",
        language="es",
        tenant_id="tenant-acme-123"
    )

    assert "voice_id" in result
    assert result["name"] == "Voz Corporativa CEO"
    assert result["status"] == "ready"


@pytest.mark.asyncio
async def test_tts_synthesis_wav_format():
    """Verifica que la síntesis TTS devuelva audio Base64 que decodifique en un archivo WAV válido."""
    text_to_speak = "Bienvenido a E-MIS@RIO SAS. Su solución de voz con IA."
    
    tts_result = await voice_studio_service.synthesize(
        text=text_to_speak,
        voice_id="preset-valeria-es",
        language="es",
        speed=1.0
    )

    assert "audio_base64" in tts_result
    decoded_audio = base64.b64decode(tts_result["audio_base64"])
    
    # Validar firma de archivo WAV (RIFF...WAVE)
    assert decoded_audio.startswith(b"RIFF")
    assert b"WAVE" in decoded_audio[:12]
    assert tts_result["duration_seconds"] > 0
    assert tts_result["characters_processed"] == len(text_to_speak)


@pytest.mark.asyncio
async def test_asr_transcription():
    """Verifica la transcripción de audio (ASR) con retorno de texto y confianza."""
    fake_audio = b"sample_pcm_audio_bytes"
    asr_result = await voice_studio_service.transcribe(fake_audio, language="es")

    assert "transcription" in asr_result
    assert len(asr_result["transcription"]) > 0
    assert asr_result["confidence"] >= 0.90


def test_preset_voices_catalog():
    """Verifica que existan las voces por defecto del sistema (Valeria, Mateo, Sophia)."""
    presets = voice_studio_service.PRESET_VOICES
    assert len(presets) >= 3
    names = [p["name"] for p in presets]
    assert any("Valeria" in n for n in names)
    assert any("Mateo" in n for n in names)
