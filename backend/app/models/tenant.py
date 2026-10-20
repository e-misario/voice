"""
Modelo de datos para inquilinos (Tenants) en el SaaS multi-tenant.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    custom_domain = Column(String(255), unique=True, nullable=True)
    status = Column(String(32), default="active", nullable=False)  # active, suspended, trial
    settings_json = Column(JSON, default=dict, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relaciones
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    voices = relationship("Voice", back_populates="tenant", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="tenant", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="tenant", cascade="all, delete-orphan")
