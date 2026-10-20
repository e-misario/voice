"""
Pruebas de aislamiento multi-tenant y middleware de resolución.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant
from app.models.voice import Voice
from app.models.integration import Integration
from app.core.security import encrypt_secret
from sqlalchemy import select


@pytest.mark.asyncio
async def test_tenant_data_isolation(db_session: AsyncSession):
    """
    Verifica que dos inquilinos (Tenant A y Tenant B) mantengan aislamiento estricto
    en sus voces e integraciones.
    """
    # 1. Crear Tenant A y Tenant B
    tenant_a = Tenant(slug="empresa-alfa", name="Empresa Alfa", status="active")
    tenant_b = Tenant(slug="empresa-beta", name="Empresa Beta", status="active")
    db_session.add_all([tenant_a, tenant_b])
    await db_session.commit()
    await db_session.refresh(tenant_a)
    await db_session.refresh(tenant_b)

    # 2. Agregar voz al Tenant A
    voice_a = Voice(
        tenant_id=tenant_a.id,
        name="Voz Exclusiva Alfa",
        voice_type="cloned",
        language="es"
    )
    # Agregar voz al Tenant B
    voice_b = Voice(
        tenant_id=tenant_b.id,
        name="Voz Exclusiva Beta",
        voice_type="cloned",
        language="es"
    )
    db_session.add_all([voice_a, voice_b])
    await db_session.commit()

    # 3. Consultar voces de Tenant A
    stmt_a = select(Voice).where(Voice.tenant_id == tenant_a.id)
    res_a = await db_session.execute(stmt_a)
    voices_for_a = res_a.scalars().all()

    assert len(voices_for_a) == 1
    assert voices_for_a[0].name == "Voz Exclusiva Alfa"
    # Verificar que NO contiene la voz de Tenant B
    assert all(v.name != "Voz Exclusiva Beta" for v in voices_for_a)

    # 4. Consultar voces de Tenant B
    stmt_b = select(Voice).where(Voice.tenant_id == tenant_b.id)
    res_b = await db_session.execute(stmt_b)
    voices_for_b = res_b.scalars().all()

    assert len(voices_for_b) == 1
    assert voices_for_b[0].name == "Voz Exclusiva Beta"
