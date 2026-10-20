"""
Aplicación principal FastAPI para E-MIS@RIO SAS (SaaS Multi-tenant de Voz con IA).
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.middleware.tenant import TenantResolutionMiddleware
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización al arrancar el servidor (creación de esquemas y tablas)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="SaaS Multi-tenant de Voz con IA, TTS, ASR y Clonación de Voz (VoiceStudio) para E-MIS@RIO SAS.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# 1. Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Configurar middleware multi-tenant
app.add_middleware(TenantResolutionMiddleware)

# 3. Montar API v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Raíz de la API")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "brand": "E-MIS@RIO SAS",
        "domain": settings.PUBLIC_DOMAIN,
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador centralizado de errores para evitar fugas de información interna."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor en la plataforma de voz.", "error_type": type(exc).__name__}
    )
