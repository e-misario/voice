# Architectural Decision Records (ADRs) — E-MIS@RIO SAS

## ADR-001: Arquitectura Multi-Tenant y Aislamiento de Datos
- **Fecha:** 2026-10-20
- **Estado:** Aceptado
- **Contexto:** E-MIS@RIO SAS requiere servir a múltiples clientes (empresas/inquilinos) de forma aislada, permitiendo que cada inquilino configure su propia IA, voz clonada, integraciones de mensajería (WhatsApp/Telegram), SMTP y pasarelas de pago.
- **Decisión:** 
  - Estrategia híbrida: Base de datos relacional PostgreSQL con columna discriminadora `tenant_id` indexada y soporte de Row Level Security (RLS) / session context en SQLAlchemy.
  - Resolución de tenant en requests entrantes mediante middleware FastAPI:
    1. Subdominio (ej. `acme.voice.e-misario.com`).
    2. Header explícito `X-Tenant-ID`.
    3. Claim `tenant_id` en JWT token de usuario autenticado.
- **Consecuencias:** Máximo rendimiento con escalabilidad simplificada y migraciones unificadas mediante Alembic.

## ADR-002: Exposición y Wrapper del Motor de Audio VoiceStudio
- **Fecha:** 2026-10-20
- **Estado:** Aceptado
- **Contexto:** VoiceStudio provee inferencia para clonación de voz, TTS y ASR (Whisper/F5-TTS/CosyVoice). Se requiere integrarlo con alta disponibilidad y control por inquilino.
- **Decisión:**
  - Se implementa un microservicio/adaptador en Python FastAPI (`backend/app/services/voice_engine.py` y endpoints en `/api/v1/voice/`) que envuelve la API/CLI de VoiceStudio o su contenedor `debpalash/VoiceStudio`.
  - Provee soporte dual: llamadas directas al motor local VoiceStudio cuando está activo, y emulador/adaptador con fallback inteligente si el modelo está en proceso de carga o si se delega a proveedores externos configurados por el tenant.
- **Consecuencias:** Alta resiliencia, cero bloqueo en la API principal del SaaS, decoupling total del motor de audio.

## ADR-003: Sistema de Precios Dinámico por País y Redondeo
- **Fecha:** 2026-10-20
- **Estado:** Aceptado
- **Contexto:** El SaaS se comercializa globalmente pero requiere cobro en moneda local adaptada y psicológicamente amigable para Colombia, México, Argentina, EE.UU., Canadá y resto del mundo.
- **Decisión:**
  - Detección de país en el frontend mediante header de Cloudflare (`CF-IPCountry`) y API backend `/api/v1/pricing/geo`.
  - Base de cálculo en USD con tipos de cambio actualizables o fijados por el Superadmin con márgenes porcentuales.
  - Reglas de redondeo automáticas:
    - **Colombia (COP):** Redondeo a múltiplos de 1.000 COP (ej. $119.000 COP).
    - **México (MXN) / Argentina (ARS):** Redondeo a múltiplos de 10 (ej. $590 MXN).
    - **Estados Unidos (USD) / Canadá (CAD):** 2 decimales terminados en .99 o .00 (ej. $29.99 USD).
- **Consecuencias:** Experiencia de compra natural sin fricción de divisas para el cliente final.

## ADR-004: Stack Tecnológico de Frontend y Backend
- **Fecha:** 2026-10-20
- **Estado:** Aceptado
- **Backend:** Python 3.11+ con FastAPI, SQLAlchemy async, Pydantic v2, PostgreSQL, Redis para cache/colas, pytest para testing.
- **Frontend:** Next.js 14+ (App Router), TypeScript estricto, TailwindCSS con estética premium y diseño responsive mobile-first y desktop.
