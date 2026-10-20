"""
Modelo de datos para el CMS de la página Home y contenidos editables por el Superadmin.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.core.database import Base


class CMSHomeConfig(Base):
    __tablename__ = "cms_home_config"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    section_key = Column(String(64), unique=True, index=True, nullable=False)  # 'hero', 'demo', 'features', 'pricing_header', 'footer'
    content_json = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
