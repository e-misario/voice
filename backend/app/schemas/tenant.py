"""
Esquemas Pydantic para administración de inquilinos (Tenants).
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    custom_domain: Optional[str] = None
    admin_email: str
    admin_password: str
    admin_name: str


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    custom_domain: Optional[str] = None
    status: Optional[str] = None  # active, suspended, trial
    settings_json: Optional[Dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: str
    slug: str
    name: str
    custom_domain: Optional[str]
    status: str
    settings_json: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
