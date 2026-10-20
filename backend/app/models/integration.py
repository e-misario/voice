"""
Modelo de datos para integraciones de terceros (IA, WhatsApp, Telegram, SMTP, Pasarelas de pago).
Las credenciales se almacenan cifradas en `encrypted_config`.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(32), nullable=False)  # ai, whatsapp, telegram, smtp, stripe, mercadopago, wompi
    encrypted_config = Column(Text, nullable=False)  # JSON cifrado con Fernet
    is_enabled = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="unconfigured", nullable=False)  # connected, error, unconfigured
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('tenant_id', 'kind', name='uq_tenant_integration_kind'),
    )

    # Relación
    tenant = relationship("Tenant", back_populates="integrations")
