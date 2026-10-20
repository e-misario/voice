"""
Endpoints para administración de integraciones de terceros por inquilino.
Cifra credenciales sensibles y ejecuta pruebas de conexión.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.integration import Integration
from app.schemas.integration import (
    IntegrationResponse,
    IntegrationSaveRequest,
    IntegrationTestResponse
)
from app.services.integrations_manager import integrations_manager

router = APIRouter()


@router.get("/tenants/{tenant_id}/integrations", response_model=List[IntegrationResponse], summary="Listar integraciones de un inquilino")
async def list_tenant_integrations(tenant_id: str, db: AsyncSession = Depends(get_db)):
    """Retorna las integraciones configuradas para el tenant con secretos enmascarados."""
    stmt = select(Integration).where(Integration.tenant_id == tenant_id)
    result = await db.execute(stmt)
    records = result.scalars().all()

    output = []
    for r in records:
        decrypted = integrations_manager.decrypt_payload(r.encrypted_config)
        masked = integrations_manager.mask_config(decrypted)
        output.append(IntegrationResponse(
            id=str(r.id),
            tenant_id=str(r.tenant_id),
            kind=r.kind,
            masked_config=masked,
            is_enabled=r.is_enabled,
            status=r.status,
            last_tested_at=r.last_tested_at,
            last_error_message=r.last_error_message
        ))
    return output


@router.get("/tenants/{tenant_id}/integrations/{kind}", response_model=IntegrationResponse, summary="Obtener configuración de integración")
async def get_single_integration(tenant_id: str, kind: str, db: AsyncSession = Depends(get_db)):
    """Obtiene una integración específica para el tenant."""
    stmt = select(Integration).where(
        (Integration.tenant_id == tenant_id) & (Integration.kind == kind.lower())
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        return IntegrationResponse(
            id=f"empty-{kind}",
            tenant_id=tenant_id,
            kind=kind,
            masked_config={},
            is_enabled=False,
            status="unconfigured",
            last_tested_at=None,
            last_error_message=None
        )

    decrypted = integrations_manager.decrypt_payload(record.encrypted_config)
    masked = integrations_manager.mask_config(decrypted)

    return IntegrationResponse(
        id=str(record.id),
        tenant_id=str(record.tenant_id),
        kind=record.kind,
        masked_config=masked,
        is_enabled=record.is_enabled,
        status=record.status,
        last_tested_at=record.last_tested_at,
        last_error_message=record.last_error_message
    )


@router.put("/tenants/{tenant_id}/integrations/{kind}", response_model=IntegrationResponse, summary="Guardar o actualizar integración")
async def save_integration(
    tenant_id: str,
    kind: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Guarda o actualiza las credenciales cifradas de una integración."""
    kind_lower = kind.lower().strip()
    is_enabled = payload.pop("is_enabled", True)

    stmt = select(Integration).where(
        (Integration.tenant_id == tenant_id) & (Integration.kind == kind_lower)
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    encrypted_data = integrations_manager.encrypt_payload(payload)

    if not record:
        record = Integration(
            tenant_id=tenant_id,
            kind=kind_lower,
            encrypted_config=encrypted_data,
            is_enabled=is_enabled,
            status="connected"
        )
        db.add(record)
    else:
        record.encrypted_config = encrypted_data
        record.is_enabled = is_enabled
        record.status = "connected"

    await db.commit()
    await db.refresh(record)

    masked = integrations_manager.mask_config(payload)
    return IntegrationResponse(
        id=str(record.id),
        tenant_id=str(record.tenant_id),
        kind=record.kind,
        masked_config=masked,
        is_enabled=record.is_enabled,
        status=record.status,
        last_tested_at=record.last_tested_at,
        last_error_message=record.last_error_message
    )


@router.post("/tenants/{tenant_id}/integrations/{kind}/test", response_model=IntegrationTestResponse, summary="Probar conexión de integración")
async def test_integration_endpoint(
    tenant_id: str,
    kind: str,
    config: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Ejecuta una prueba en vivo de las credenciales proporcionadas."""
    success, message, details = await integrations_manager.test_integration(kind, config)

    # Actualizar estado en DB si ya existe el registro
    stmt = select(Integration).where(
        (Integration.tenant_id == tenant_id) & (Integration.kind == kind.lower())
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if record:
        record.last_tested_at = datetime.now(timezone.utc)
        record.status = "connected" if success else "error"
        record.last_error_message = None if success else message
        await db.commit()

    return IntegrationTestResponse(
        success=success,
        message=message,
        tested_at=datetime.now(timezone.utc),
        details=details
    )
