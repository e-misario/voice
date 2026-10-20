"""
Módulo de seguridad para hashing de contraseñas, generación y validación de tokens JWT,
y cifrado/descifrado de secretos e integraciones sensibles de inquilinos.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import base64
import hashlib
from jose import jwt, JWTError
import bcrypt
from cryptography.fernet import Fernet

from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con el hash almacenado."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Genera un hash seguro para la contraseña usando bcrypt nativo."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    tenant_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un token JWT firmado que incluye sujeto, rol y tenant_id para multi-tenancy.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": str(tenant_id) if tenant_id else None
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodifica y valida un token JWT; retorna el payload o None si es inválido."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def get_fernet_cipher() -> Fernet:
    """Obtiene una instancia de Fernet derivada de la clave de encriptación configurada."""
    # Asegura una clave de 32 bytes en formato base64 URL-safe
    derived_key = base64.urlsafe_b64encode(hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest())
    return Fernet(derived_key)


def encrypt_secret(secret_text: str) -> str:
    """Cifra un secreto sensible (ej. API keys de WhatsApp, OpenAI, pasarelas) en base64."""
    if not secret_text:
        return ""
    cipher = get_fernet_cipher()
    encrypted_bytes = cipher.encrypt(secret_text.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_secret(encrypted_text: str) -> str:
    """Descifra un secreto previamente encriptado."""
    if not encrypted_text:
        return ""
    try:
        cipher = get_fernet_cipher()
        decrypted_bytes = cipher.decrypt(encrypted_text.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""


def mask_secret(secret_text: str) -> str:
    """Enmascara un secreto para vistas seguras de frontend mostrando solo los últimos 4 caracteres."""
    if not secret_text:
        return ""
    if len(secret_text) <= 4:
        return "****"
    return f"****...{secret_text[-4:]}"
