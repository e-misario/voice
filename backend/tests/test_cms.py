"""
Pruebas unitarias para el CMS de la página Home (Superadmin).
Verifica la obtención y actualización de contenidos dinámicos.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_home_cms_defaults(client: AsyncClient):
    """Verifica que al consultar el CMS del Home por primera vez devuelva las secciones por defecto."""
    response = await client.get("/api/v1/cms/home")
    assert response.status_code == 200
    data = response.json()

    assert "hero" in data
    assert "demo" in data
    assert "features" in data
    assert "pricing_header" in data

    assert "Voz con IA" in data["hero"]["title_main"]
    assert "VoiceStudio" in data["hero"]["badge_text"]
    assert len(data["features"]["cards"]) >= 3


@pytest.mark.asyncio
async def test_update_home_cms(client: AsyncClient):
    """Verifica que el Superadmin pueda actualizar textos del Home y persistan correctamente."""
    cms_payload = {
        "hero": {
            "badge_text": "VoiceStudio IA v2.0 | Marca E-MIS@RIO SAS",
            "title_main": "El Estándar de la Voz Neuronal y",
            "title_highlight": "Clonación Empresarial",
            "description": "Texto corporativo actualizado por el CMS para E-MIS@RIO SAS.",
            "cta_primary_text": "Explorar Estudio",
            "cta_secondary_text": "Administración"
        },
        "demo": {
            "title": "Prueba de Audio en Vivo",
            "subtitle": "Generación en tiempo real con VoiceStudio.",
            "default_text": "Texto de prueba actualizado desde el CMS."
        },
        "features": {
            "header_title": "Potencia de Voz para Empresas",
            "header_subtitle": "Infraestructura multi-tenant segura.",
            "cards": [
                {
                    "title": "Clonación Precisa",
                    "description": "Clonación de voz con 15 segundos de audio.",
                    "icon": "mic"
                }
            ]
        },
        "pricing_header": {
            "badge": "Precios Dinámicos",
            "title": "Planes en Divisa Local",
            "subtitle": "Convertidos automáticamente."
        }
    }

    put_res = await client.put("/api/v1/cms/home", json=cms_payload)
    assert put_res.status_code == 200
    updated_data = put_res.json()
    assert updated_data["hero"]["title_highlight"] == "Clonación Empresarial"
    assert updated_data["hero"]["badge_text"] == "VoiceStudio IA v2.0 | Marca E-MIS@RIO SAS"

    # Verificar persistencia en una consulta posterior GET
    get_res = await client.get("/api/v1/cms/home")
    assert get_res.status_code == 200
    refreshed_data = get_res.json()
    assert refreshed_data["hero"]["title_highlight"] == "Clonación Empresarial"
