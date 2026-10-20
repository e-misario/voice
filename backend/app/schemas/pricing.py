"""
Esquemas Pydantic para el motor de precios por país, monedas y reglas de redondeo.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CountryPricingCreate(BaseModel):
    country_code: str = Field(..., min_length=2, max_length=2)
    country_name: str = Field(..., min_length=2, max_length=100)
    currency: str = Field(..., min_length=3, max_length=3)
    usd_base_price: float = Field(..., gt=0)
    exchange_rate: float = Field(..., gt=0)
    margin_pct: float = Field(default=15.0, ge=0)
    rounding_rule: str = Field(default="none")  # thousands, tens, cents, none
    plan_tier: str = Field(default="pro")


class CountryPricingUpdate(BaseModel):
    usd_base_price: Optional[float] = None
    exchange_rate: Optional[float] = None
    margin_pct: Optional[float] = None
    rounding_rule: Optional[str] = None
    plan_tier: Optional[str] = None


class CountryPricingResponse(BaseModel):
    id: str
    country_code: str
    country_name: str
    currency: str
    usd_base_price: float
    exchange_rate: float
    margin_pct: float
    calculated_local_price: float
    rounding_rule: str
    plan_tier: str
    formatted_price: str
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class GeoPricingResponse(BaseModel):
    detected_country: str
    currency: str
    price: float
    formatted_price: str
    usd_equivalent: float
    plan_tier: str
    all_plans: List[CountryPricingResponse]
