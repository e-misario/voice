"""
Esquemas Pydantic para el motor de audio y VoiceStudio: Clonación, TTS y ASR.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VoiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    language: str = Field(default="es", max_length=10)
    gender: str = Field(default="neutral", max_length=16)
    description: Optional[str] = None
    is_default: bool = False


class VoiceResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    voice_type: str
    language: str
    gender: str
    sample_audio_path: Optional[str]
    description: Optional[str]
    is_default: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: Optional[str] = None
    language: str = Field(default="es", max_length=10)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    emotion: Optional[str] = Field(default="neutral")
    output_format: str = Field(default="mp3")  # mp3, wav, ogg


class TTSResponse(BaseModel):
    audio_base64: str
    format: str
    duration_seconds: float
    characters_processed: int
    voice_name: str


class ASRResponse(BaseModel):
    transcription: str
    language_detected: str
    duration_seconds: float
    confidence: float
    words: Optional[List[Dict[str, Any]]] = None
