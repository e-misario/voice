"""
Endpoints para gestión de reuniones bilingües, transcripción y traducción en tiempo real.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import (
    MeetingCreate,
    MeetingResponse,
    MeetingUpdate,
    MeetingTranscriptEntry
)

router = APIRouter()


@router.get("/meetings", response_model=List[MeetingResponse], summary="Listar reuniones del inquilino")
async def list_meetings(request: Request, db: AsyncSession = Depends(get_db)):
    """Lista las reuniones programadas o históricas del tenant actual."""
    tenant_id = getattr(request.state, "tenant_id", None) or "default-tenant-emisario"
    stmt = select(Meeting).where(Meeting.tenant_id == tenant_id).order_by(Meeting.created_at.desc())
    result = await db.execute(stmt)
    records = result.scalars().all()

    return [
        MeetingResponse(
            id=str(r.id),
            tenant_id=str(r.tenant_id),
            title=r.title,
            source_language=r.source_language,
            target_language=r.target_language,
            status=r.status,
            transcript_log=r.transcript_log or [],
            summary=r.summary,
            created_at=r.created_at,
            updated_at=r.updated_at
        ) for r in records
    ]


@router.post("/meetings", response_model=MeetingResponse, summary="Crear una nueva reunión bilingüe")
async def create_meeting(request: Request, payload: MeetingCreate, db: AsyncSession = Depends(get_db)):
    """Inicia o programa una sala de reunión con traducción simultánea."""
    tenant_id = getattr(request.state, "tenant_id", None) or "default-tenant-emisario"
    
    meeting = Meeting(
        tenant_id=tenant_id,
        title=payload.title,
        source_language=payload.source_language,
        target_language=payload.target_language,
        status="live",
        transcript_log=[
            {
                "speaker": "Sistema",
                "original_text": "Sala de reunión bilingüe iniciada. Traducción de audio activa.",
                "translated_text": "Bilingual meeting room initialized. Live voice translation active.",
                "timestamp": 0.0,
                "source_lang": payload.source_language,
                "target_lang": payload.target_language
            }
        ]
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)

    return MeetingResponse(
        id=str(meeting.id),
        tenant_id=str(meeting.tenant_id),
        title=meeting.title,
        source_language=meeting.source_language,
        target_language=meeting.target_language,
        status=meeting.status,
        transcript_log=meeting.transcript_log,
        summary=meeting.summary,
        created_at=meeting.created_at,
        updated_at=meeting.updated_at
    )


@router.post("/meetings/{meeting_id}/transcript", response_model=MeetingResponse, summary="Agregar segmento traducido a la reunión")
async def append_transcript(
    meeting_id: str,
    entry: MeetingTranscriptEntry,
    db: AsyncSession = Depends(get_db)
):
    """Agrega un bloque de voz original y su versión traducida al log de la reunión."""
    stmt = select(Meeting).where(Meeting.id == meeting_id)
    result = await db.execute(stmt)
    meeting = result.scalar_one_or_none()

    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada.")

    current_log = list(meeting.transcript_log or [])
    current_log.append(entry.dict())
    meeting.transcript_log = current_log

    await db.commit()
    await db.refresh(meeting)

    return MeetingResponse(
        id=str(meeting.id),
        tenant_id=str(meeting.tenant_id),
        title=meeting.title,
        source_language=meeting.source_language,
        target_language=meeting.target_language,
        status=meeting.status,
        transcript_log=meeting.transcript_log,
        summary=meeting.summary,
        created_at=meeting.created_at,
        updated_at=meeting.updated_at
    )
