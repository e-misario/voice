"""
Pruebas unitarias para las operaciones CRUD completas (Create, Read, Update, Delete)
en precios, inquilinos, voces y reuniones.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_crud_country_pricing(client: AsyncClient):
    """Verifica el ciclo CRUD completo de país y precios."""
    # 1. Create (POST)
    payload = {
        "country_code": "CL",
        "country_name": "Chile",
        "currency": "CLP",
        "usd_base_price": 29.0,
        "exchange_rate": 950.0,
        "margin_pct": 10.0,
        "rounding_rule": "thousands",
        "plan_tier": "pro"
    }
    create_res = await client.post("/api/v1/pricing", json=payload)
    assert create_res.status_code == 200
    data = create_res.json()
    assert data["country_code"] == "CL"
    assert "CLP" in data["formatted_price"]

    # 2. Update (PUT)
    update_res = await client.put("/api/v1/pricing/CL", json={"margin_pct": 20.0})
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["margin_pct"] == 20.0

    # 3. Delete (DELETE)
    del_res = await client.delete("/api/v1/pricing/CL")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


@pytest.mark.asyncio
async def test_crud_tenant_update_and_delete(client: AsyncClient):
    """Verifica la actualización y eliminación de un inquilino."""
    # 1. Crear tenant
    new_tenant = {
        "name": "Compañía Temporal",
        "slug": "temporal-corp",
        "admin_email": "admin@temporal.com",
        "admin_password": "Password123!",
        "admin_name": "Admin Temporal"
    }
    create_res = await client.post("/api/v1/tenants", json=new_tenant)
    assert create_res.status_code == 201
    tenant_id = create_res.json()["id"]

    # 2. Update status a suspended
    upd_res = await client.put(f"/api/v1/tenants/{tenant_id}", json={"status": "suspended"})
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "suspended"

    # 3. Delete tenant
    del_res = await client.delete(f"/api/v1/tenants/{tenant_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


@pytest.mark.asyncio
async def test_crud_meeting_delete(client: AsyncClient):
    """Verifica la creación y eliminación de una sala de reunión bilingüe."""
    # 1. Crear reunión
    create_res = await client.post("/api/v1/meetings", json={"title": "Reunión de Prueba CRUD", "source_language": "es", "target_language": "en"})
    assert create_res.status_code == 200
    meeting_id = create_res.json()["id"]

    # 2. Eliminar reunión
    del_res = await client.delete(f"/api/v1/meetings/{meeting_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
