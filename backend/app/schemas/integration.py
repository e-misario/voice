"""
Esquemas Pydantic para integraciones de terceros (IA, WhatsApp, Telegram, SMTP, Pasarelas).
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class IntegrationSaveRequest(BaseModel):
    kind: str = Field(..., pattern=r"^(ai|whatsapp|telegram|smtp|stripe|mercadopago|wompi)$")
    config: Dict[str, Any]
    is_enabled: bool = True


class IntegrationResponse(BaseModel):
    id: str
    tenant_id: str
    kind: str
    masked_config: Dict[str, Any]
    is_enabled: bool
    status: str
    last_tested_at: Optional[datetime]
    last_error_message: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class IntegrationTestResponse(BaseModel):
    success: bool
    message: str
    tested_at: datetime
    details: Optional[Dict[str, Any]] = None
