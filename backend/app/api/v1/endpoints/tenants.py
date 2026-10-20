"""
Endpoints para administración de Inquilinos (Tenants) en el SaaS Multi-tenant.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

router = APIRouter()


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED, summary="Registrar o crear un nuevo inquilino")
async def create_tenant(payload: TenantCreate, db: AsyncSession = Depends(get_db)):
    """Crea un nuevo inquilino y asigna a su usuario administrador inicial."""
    # Verificar si el slug ya existe
    stmt = select(Tenant).where(Tenant.slug == payload.slug)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El subdominio/slug '{payload.slug}' ya se encuentra registrado."
        )

    # Verificar si el email ya existe
    stmt_user = select(User).where(User.email == payload.admin_email)
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo '{payload.admin_email}' ya está en uso."
        )

    # Crear inquilino
    tenant = Tenant(
        name=payload.name,
        slug=payload.slug.lower().strip(),
        custom_domain=payload.custom_domain,
        status="active",
        settings_json={"quota_tts_chars": 500000, "quota_asr_minutes": 1000}
    )
    db.add(tenant)
    await db.flush()

    # Crear usuario administrador del inquilino
    admin_user = User(
        tenant_id=tenant.id,
        email=payload.admin_email.lower().strip(),
        password_hash=get_password_hash(payload.admin_password),
        full_name=payload.admin_name,
        role="tenant_admin",
        is_active=True
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(tenant)

    return TenantResponse(
        id=str(tenant.id),
        slug=tenant.slug,
        name=tenant.name,
        custom_domain=tenant.custom_domain,
        status=tenant.status,
        settings_json=tenant.settings_json,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )


@router.get("", response_model=List[TenantResponse], summary="Listar todos los inquilinos (Superadmin)")
async def list_tenants(db: AsyncSession = Depends(get_db)):
    """Retorna la lista de todas las empresas e inquilinos registrados."""
    stmt = select(Tenant).order_by(Tenant.created_at.desc())
    result = await db.execute(stmt)
    tenants = result.scalars().all()

    return [
        TenantResponse(
            id=str(t.id),
            slug=t.slug,
            name=t.name,
            custom_domain=t.custom_domain,
            status=t.status,
            settings_json=t.settings_json or {},
            created_at=t.created_at,
            updated_at=t.updated_at
        ) for t in tenants
    ]


@router.get("/{tenant_id}", response_model=TenantResponse, summary="Obtener detalle de un inquilino")
async def get_tenant_detail(tenant_id: str, db: AsyncSession = Depends(get_db)):
    """Obtiene información detallada de un inquilino por ID o por slug."""
    stmt = select(Tenant).where((Tenant.id == tenant_id) | (Tenant.slug == tenant_id))
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquilino no encontrado.")

    return TenantResponse(
        id=str(tenant.id),
        slug=tenant.slug,
        name=tenant.name,
        custom_domain=tenant.custom_domain,
        status=tenant.status,
        settings_json=tenant.settings_json or {},
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )
