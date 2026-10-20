"""
Modelo de datos para catálogo de voces (clonadas, personalizadas y presets de VoiceStudio).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Voice(Base):
    __tablename__ = "voices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    voice_type = Column(String(32), default="cloned", nullable=False)  # cloned, preset, system
    language = Column(String(10), default="es", nullable=False)
    gender = Column(String(16), default="neutral", nullable=False)
    sample_audio_path = Column(String(512), nullable=True)
    embedding_data = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación
    tenant = relationship("Tenant", back_populates="voices")
