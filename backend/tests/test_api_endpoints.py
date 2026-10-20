"""
Pruebas integrales de endpoints de la API FastAPI v1 (E2E API Testing).
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Verifica el endpoint de salud del sistema."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "public_domain" in data


@pytest.mark.asyncio
async def test_geo_pricing_colombia(client: AsyncClient):
    """Verifica que al consultar con país CO devuelva pesos colombianos con formato."""
    response = await client.get("/api/v1/pricing/geo?country=CO")
    assert response.status_code == 200
    data = response.json()
    assert data["detected_country"] == "CO"
    assert data["currency"] == "COP"
    assert "COP" in data["formatted_price"]
    assert len(data["all_plans"]) >= 1


@pytest.mark.asyncio
async def test_login_superadmin(client: AsyncClient):
    """Verifica el inicio de sesión del Superadmin de rescate."""
    login_payload = {
        "email": "admin@e-misario.com",
        "password": "Emisario2026!"
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["role"] == "superadmin"


@pytest.mark.asyncio
async def test_create_and_list_tenants(client: AsyncClient):
    """Verifica el flujo de registro y listado de un nuevo inquilino."""
    new_tenant = {
        "name": "Compañía Médica Andes",
        "slug": "medica-andes",
        "admin_email": "admin@medica-andes.com",
        "admin_password": "Password123!",
        "admin_name": "Dr. Fernando Morales"
    }
    create_res = await client.post("/api/v1/tenants", json=new_tenant)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["slug"] == "medica-andes"
    assert created_data["name"] == "Compañía Médica Andes"

    # Listar inquilinos
    list_res = await client.get("/api/v1/tenants")
    assert list_res.status_code == 200
    tenants = list_res.json()
    assert any(t["slug"] == "medica-andes" for t in tenants)


@pytest.mark.asyncio
async def test_voice_tts_endpoint(client: AsyncClient):
    """Verifica la generación de audio sintético Text-to-Speech."""
    tts_payload = {
        "text": "Hola, esta es una prueba del motor VoiceStudio para E-MIS@RIO.",
        "voice_id": "preset-valeria-es",
        "language": "es",
        "speed": 1.0
    }
    response = await client.post("/api/v1/voice/tts", json=tts_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "audio_base64" in res_data
    assert res_data["duration_seconds"] > 0
    assert res_data["format"] == "wav"


@pytest.mark.asyncio
async def test_integrations_save_and_test(client: AsyncClient):
    """Verifica el guardado y test de conectividad de una integración de IA."""
    tenant_id = "test-tenant-100"
    config_payload = {
        "provider": "openai",
        "api_key": "sk-proj-test-key-long-enough-12345",
        "model": "gpt-4o"
    }
    # Guardar integración
    save_res = await client.put(f"/api/v1/tenants/{tenant_id}/integrations/ai", json=config_payload)
    assert save_res.status_code == 200
    saved_data = save_res.json()
    assert saved_data["kind"] == "ai"
    # Debe estar enmascarado
    assert "sk-proj" not in saved_data["masked_config"]["api_key"]

    # Probar conexión
    test_res = await client.post(f"/api/v1/tenants/{tenant_id}/integrations/ai/test", json=config_payload)
    assert test_res.status_code == 200
    test_data = test_res.json()
    assert test_data["success"] is True
