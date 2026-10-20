"""
Configuración asíncrona de base de datos con SQLAlchemy.
Proporciona el engine, la sesión y el generador de dependencias `get_db`.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Determinar URL de base de datos: si estamos en test o sin URL explícita, proveer fallback sqlite asíncrono
database_url = settings.get_database_url()

# Crear motor asíncrono de SQLAlchemy
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True
)

# Fábrica de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base declarativa para modelos ORM
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia FastAPI que proporciona una sesión asíncrona de base de datos por petición."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
