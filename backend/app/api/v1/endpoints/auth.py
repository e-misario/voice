"""
Endpoints de autenticación, emisión de tokens JWT y perfil de usuario.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import LoginRequest, Token, UserResponse, UserCreate
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Extrae y valida el usuario actual a partir del token JWT Bearer."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no contiene sujeto de usuario.")
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Si es un superadmin creado al vuelo en pruebas o inicialización
        if payload.get("role") == "superadmin":
            return User(
                id=user_id,
                email=payload.get("email", "admin@e-misario.com"),
                full_name="Super Administrador",
                role="superadmin",
                is_active=True,
                tenant_id=None
            )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo.")
        
    return user


@router.post("/login", response_model=Token, summary="Inicio de sesión")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Valida credenciales y genera un token JWT con aislamiento de tenant."""
    # Soporte para credencial inicial de Superadmin de rescate
    if payload.email == "admin@e-misario.com" and payload.password in ["Emisario2026!", "admin123"]:
        token = create_access_token(
            subject="superadmin-root",
            role="superadmin",
            tenant_id=None
        )
        return Token(
            access_token=token,
            token_type="bearer",
            role="superadmin",
            tenant_id=None,
            user_id="superadmin-root",
            email=payload.email,
            full_name="Super Administrador E-MIS@RIO"
        )

    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )

    token = create_access_token(
        subject=str(user.id),
        role=user.role,
        tenant_id=str(user.tenant_id) if user.tenant_id else None
    )

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserResponse, summary="Obtener perfil del usuario autenticado")
async def get_me(current_user: User = Depends(get_current_user)):
    """Retorna los datos del usuario en sesión."""
    return UserResponse(
        id=str(current_user.id),
        tenant_id=str(current_user.tenant_id) if current_user.tenant_id else None,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )
