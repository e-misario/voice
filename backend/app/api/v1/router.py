"""
Enrutador principal de la API v1.
Agrupa los routers de salud, autenticación, precios, inquilinos, voces, integraciones y reuniones.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    auth,
    pricing,
    tenants,
    voices,
    integrations,
    meetings,
    cms
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(voices.router, prefix="/voice", tags=["VoiceStudio Engine"])
api_router.include_router(integrations.router, tags=["Integrations"])
api_router.include_router(meetings.router, tags=["Bilingual Meetings"])
api_router.include_router(cms.router, prefix="/cms", tags=["Home CMS"])
