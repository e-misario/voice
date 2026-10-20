"""
Esquemas Pydantic para autenticación, registro y tokens JWT.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: Optional[str] = None
    user_id: str
    email: str
    full_name: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "operator"
    tenant_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    tenant_id: Optional[str]
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
