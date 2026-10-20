"""
Modelo de datos para reuniones bilingües, transcripciones y traducción en tiempo real.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    source_language = Column(String(10), default="es", nullable=False)
    target_language = Column(String(10), default="en", nullable=False)
    status = Column(String(32), default="scheduled", nullable=False)  # scheduled, live, completed
    transcript_log = Column(JSON, default=list, nullable=False)
    summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación
    tenant = relationship("Tenant", back_populates="meetings")
