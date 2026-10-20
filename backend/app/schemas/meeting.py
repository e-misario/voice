"""
Esquemas Pydantic para reuniones bilingües y transcripciones.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    source_language: str = Field(default="es")
    target_language: str = Field(default="en")


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None  # scheduled, live, completed
    summary: Optional[str] = None


class MeetingTranscriptEntry(BaseModel):
    speaker: str
    original_text: str
    translated_text: str
    timestamp: float
    source_lang: str
    target_lang: str


class MeetingResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    source_language: str
    target_language: str
    status: str
    transcript_log: List[Dict[str, Any]]
    summary: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
