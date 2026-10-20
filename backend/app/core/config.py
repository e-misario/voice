"""
Configuración centralizada de la aplicación usando Pydantic Settings.
Define variables de entorno, claves de seguridad y endpoints de servicios.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "E-MIS@RIO SAS Voice AI Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Seguridad JWT
    SECRET_KEY: str = "emisario-super-secure-key-2026-antigravity-voice-ai-jwt-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    
    # Cifrado simétrico para secretos de integraciones (Fernet)
    # Llave base64 URL-safe de 32 bytes por defecto para pruebas/desarrollo
    ENCRYPTION_KEY: str = "k2f7u9z1X3c5v8b0m2n4p6q8r0t2w4y6A8C0E2G4I6K="
    
    # Base de datos
    POSTGRES_USER: str = "emisario_admin"
    POSTGRES_PASSWORD: str = "emisario_secure_password_2026"
    POSTGRES_DB: str = "emisario_voice_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # VoiceStudio Microservice Engine
    VOICESTUDIO_API_URL: str = "http://localhost:8880"
    VOICESTUDIO_TIMEOUT_SECONDS: float = 60.0
    
    # Dominio público y CORS
    PUBLIC_DOMAIN: str = "voice.e-misario.com"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://voice.e-misario.com",
        "http://192.168.2.25:3000",
    ]
    
    # Precios
    BASE_CURRENCY: str = "USD"
    DEFAULT_MARGIN_PCT: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        """Retorna la URL asíncrona de conexión a PostgreSQL."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
