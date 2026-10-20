"""
Middleware para resolución de inquilino (Tenant) y aislamiento de datos.
Extrae el inquilino a partir de:
1. Subdominio (ej. cliente.voice.e-misario.com)
2. Header X-Tenant-ID o X-Tenant-Slug
3. Claim en token JWT
"""
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.security import decode_access_token


class TenantResolutionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Valores por defecto en el estado del request
        request.state.tenant_id = None
        request.state.tenant_slug = None
        request.state.is_superadmin = False

        # 1. Intentar por Header explícito
        header_tenant_id = request.headers.get("X-Tenant-ID")
        header_tenant_slug = request.headers.get("X-Tenant-Slug")
        
        if header_tenant_id:
            request.state.tenant_id = header_tenant_id.strip()
        if header_tenant_slug:
            request.state.tenant_slug = header_tenant_slug.strip()

        # 2. Intentar por Subdominio en el Host
        host = request.headers.get("host", "").split(":")[0].lower()
        public_domain = settings.PUBLIC_DOMAIN.lower()
        
        if host.endswith(f".{public_domain}"):
            subdomain = host.replace(f".{public_domain}", "").strip()
            if subdomain and subdomain not in ["www", "api", "admin", "app"]:
                request.state.tenant_slug = subdomain

        # 3. Intentar por Token JWT (si viene en Authorization)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            if payload:
                user_role = payload.get("role")
                if user_role == "superadmin":
                    request.state.is_superadmin = True
                
                # Si el usuario tiene tenant_id y no se había fijado ya
                jwt_tenant = payload.get("tenant_id")
                if jwt_tenant and not request.state.tenant_id:
                    request.state.tenant_id = jwt_tenant

        response = await call_next(request)
        return response
