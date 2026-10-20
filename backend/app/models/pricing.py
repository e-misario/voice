"""
Modelo de datos para precios por país, monedas, tasas de cambio y reglas de redondeo.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime
from app.core.database import Base


class CountryPricing(Base):
    __tablename__ = "country_pricing"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    country_code = Column(String(2), unique=True, index=True, nullable=False)  # CO, MX, US, CA, AR, etc.
    country_name = Column(String(100), nullable=False)
    currency = Column(String(3), nullable=False)  # COP, MXN, USD, CAD, ARS
    usd_base_price = Column(Numeric(10, 2), default=29.00, nullable=False)
    exchange_rate = Column(Numeric(14, 4), default=1.0000, nullable=False)
    margin_pct = Column(Numeric(5, 2), default=15.00, nullable=False)
    calculated_local_price = Column(Numeric(14, 2), nullable=False)
    rounding_rule = Column(String(32), default="none", nullable=False)  # thousands, tens, cents, none
    plan_tier = Column(String(32), default="pro", nullable=False)  # starter, pro, enterprise
    
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
