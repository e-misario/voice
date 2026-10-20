"""
Endpoints para VoiceStudio: Clonación de voces, Text-to-Speech (TTS) y Speech-to-Text (ASR).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.voice import Voice
from app.schemas.voice import (
    VoiceResponse,
    TTSRequest,
    TTSResponse,
    ASRResponse
)
from app.services.voice_studio import voice_studio_service

router = APIRouter()


@router.get("/voices", response_model=List[VoiceResponse], summary="Listar catálogo de voces disponibles para el inquilino")
async def list_voices(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Retorna el catálogo unificado de voces del sistema más las voces clonadas del inquilino.
    """
    tenant_id = getattr(request.state, "tenant_id", None) or "global-default-tenant"

    output: List[VoiceResponse] = []

    # 1. Agregar voces del sistema
    for pv in voice_studio_service.PRESET_VOICES:
        output.append(VoiceResponse(
            id=pv["id"],
            tenant_id="system",
            name=pv["name"],
            voice_type=pv["voice_type"],
            language=pv["language"],
            gender=pv["gender"],
            sample_audio_path=None,
            description=pv["description"],
            is_default=(pv["id"] == "preset-valeria-es"),
            created_at=None  # type: ignore
        ))

    # 2. Agregar voces clonadas del tenant desde la base de datos
    stmt = select(Voice).where(Voice.tenant_id == tenant_id).order_by(Voice.created_at.desc())
    result = await db.execute(stmt)
    tenant_voices = result.scalars().all()

    for tv in tenant_voices:
        output.append(VoiceResponse(
            id=str(tv.id),
            tenant_id=str(tv.tenant_id),
            name=tv.name,
            voice_type=tv.voice_type,
            language=tv.language,
            gender=tv.gender,
            sample_audio_path=tv.sample_audio_path,
            description=tv.description,
            is_default=tv.is_default,
            created_at=tv.created_at
        ))

    return output


@router.post("/clone", response_model=VoiceResponse, summary="Clonar voz a partir de muestra de audio")
async def clone_voice_endpoint(
    request: Request,
    name: str = Form(..., description="Nombre de la nueva voz clonada"),
    language: str = Form("es", description="Idioma principal de la voz"),
    gender: str = Form("neutral"),
    description: Optional[str] = Form(None),
    audio_file: UploadFile = File(..., description="Archivo de audio WAV/MP3 con la muestra de voz"),
    db: AsyncSession = Depends(get_db)
):
    """
    Procesa el archivo de audio con VoiceStudio, genera el embedding y guarda la voz asociada al tenant.
    """
    tenant_id = getattr(request.state, "tenant_id", None) or "default-tenant-emisario"

    # Leer muestra de audio
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="El archivo de audio está vacío.")

    # Ejecutar clonación vía VoiceStudio
    clone_res = await voice_studio_service.clone_voice(
        audio_content=audio_bytes,
        voice_name=name,
        language=language,
        tenant_id=tenant_id
    )

    # Persistir en base de datos
    new_voice = Voice(
        tenant_id=tenant_id,
        name=name,
        voice_type="cloned",
        language=language,
        gender=gender,
        description=description or f"Voz clonada a partir de {audio_file.filename}",
        sample_audio_path=f"/uploads/samples/{audio_file.filename}",
        embedding_data={"engine": clone_res.get("engine"), "embedding_size": clone_res.get("embedding_size")}
    )
    db.add(new_voice)
    await db.commit()
    await db.refresh(new_voice)

    return VoiceResponse(
        id=str(new_voice.id),
        tenant_id=str(new_voice.tenant_id),
        name=new_voice.name,
        voice_type=new_voice.voice_type,
        language=new_voice.language,
        gender=new_voice.gender,
        sample_audio_path=new_voice.sample_audio_path,
        description=new_voice.description,
        is_default=new_voice.is_default,
        created_at=new_voice.created_at
    )


@router.post("/tts", response_model=TTSResponse, summary="Sintetizar texto a voz con IA")
async def tts_endpoint(payload: TTSRequest):
    """
    Genera audio hablado a partir de texto utilizando la voz seleccionada.
    """
    result = await voice_studio_service.synthesize(
        text=payload.text,
        voice_id=payload.voice_id,
        language=payload.language,
        speed=payload.speed,
        emotion=payload.emotion or "neutral",
        output_format=payload.output_format
    )
    return TTSResponse(**result)


@router.post("/asr", response_model=ASRResponse, summary="Transcribir audio a texto (Whisper)")
async def asr_endpoint(
    audio_file: UploadFile = File(..., description="Archivo de audio a transcribir"),
    language: str = Form("auto")
):
    """
    Transcribe una pista de voz a texto con timestamps y confianza.
    """
    content = await audio_file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo de audio vacío.")
        
    result = await voice_studio_service.transcribe(content, language=language)
    return ASRResponse(**result)


@router.delete("/voices/{voice_id}", summary="Eliminar voz del inquilino")
async def delete_voice_endpoint(voice_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Elimina una voz propia del catálogo del tenant."""
    tenant_id = getattr(request.state, "tenant_id", None) or "default-tenant-emisario"
    stmt = select(Voice).where((Voice.id == voice_id) & (Voice.tenant_id == tenant_id))
    result = await db.execute(stmt)
    voice = result.scalar_one_or_none()
    if not voice:
        raise HTTPException(status_code=404, detail="Voz no encontrada o no pertenece al inquilino.")

    await db.delete(voice)
    await db.commit()
    return {"success": True, "message": f"Voz '{voice.name}' eliminada correctamente."}
