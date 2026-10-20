# Arquitectura del Sistema — E-MIS@RIO SAS

## Diagrama de Componentes de Alto Nivel

```mermaid
graph TD
    UserClient[Cliente / Navegador Web] -->|HTTPS voice.e-misario.com| CF[Cloudflare Tunnel]
    CF -->|Proxy local| Nginx[Nginx Reverse Proxy / Gateway]
    
    subgraph Frontend [Next.js 14+ Frontend]
        Landing[Landing Page & Geo Pricing]
        ClientPanel[Panel Cliente / Inquilino]
        SuperadminPanel[Panel Superadmin]
    end
    
    subgraph Backend [FastAPI Backend Service]
        AuthMW[Auth & RBAC Middleware]
        TenantMW[Tenant Isolation Middleware]
        APIRouters[API Routers: Auth, Tenants, Voices, Pricing, Integrations]
        VoiceAdapter[VoiceStudio Microservice Adapter]
        PricingEngine[Geo Pricing & Currency Engine]
        IntegrationsService[Integrations Manager]
    end
    
    subgraph AudioEngine [VoiceStudio Engine]
        VoiceStudioSvc[VoiceStudio Server: TTS, ASR, Clone]
    end
    
    subgraph Storage [Persistencia y Cache]
        Postgres[(PostgreSQL Multi-Tenant DB)]
        Redis[(Redis Cache & Session Broker)]
        AudioStorage[(Almacenamiento de Muestras de Audio)]
    end

    Nginx --> Frontend
    Nginx --> Backend
    Backend --> Postgres
    Backend --> Redis
    Backend --> AudioStorage
    Backend --> VoiceStudioSvc
```

## Flujo de Resolución de Inquilinos (Multi-Tenancy)
1. **Subdominio:** Un cliente accede por `empresa-a.voice.e-misario.com`. El middleware extrae `empresa-a` y consulta el inquilino activo.
2. **Header:** Solicitudes directas de API pueden enviar `X-Tenant-ID: <uuid_o_slug>`.
3. **Token JWT:** Usuarios autenticados llevan el claim `tenant_id` en su token de sesión.
4. **Aislamiento en Consultas:** Toda operación de lectura/escritura filtra forzosamente por `tenant_id`.

## Modelo de Precios y Geolocalización
- Detección primaria vía Cloudflare Header `CF-IPCountry`.
- Conversión de precios base en USD a monedas locales (COP, MXN, ARS, CAD, EUR, etc.).
- Reglas de redondeo comercial para no mostrar precios con fracciones extrañas.
- Panel Superadmin para ajustar tasas de cambio y márgenes por país.
