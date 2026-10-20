"""
Endpoint de verificación de estado y salud del sistema (Healthcheck).
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Healthcheck general de la API")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "public_domain": settings.PUBLIC_DOMAIN,
        "version": "1.0.0"
    }
