# PLAN MAESTRO DE IMPLEMENTACIÓN — E-MIS@RIO SAS

## Visión General
Construcción, despliegue y validación integral del SaaS multi-tenant de voz con IA para **E-MIS@RIO SAS** potenciado por el motor **VoiceStudio**.

---

## Hitos del Proyecto

### 📍 Hito 0: Reconocimiento y Planificación Arquitectónica
- [x] Análisis del motor de audio VoiceStudio (endpoints de clonación, TTS, ASR y compatibilidad API).
- [x] Definición del modelo de datos multi-tenant (tenants, users, subscriptions, pricing_rules, integrations, meetings, voices).
- [x] Configuración de subagentes, workflows y directrices de Antigravity en `.agents/`.
- [x] Formalización de decisiones arquitectónicas en `DECISIONS.md`.

### 📍 Hito 1: Scaffolding y Configuración Base
- [ ] Estructura de carpetas (`backend/`, `frontend/`, `infra/`, `scripts/`, `docs/`).
- [ ] Variables de entorno `.env.example` y configuraciones unificadas.
- [ ] Configuración de base de datos PostgreSQL multi-tenant y migraciones.

### 📍 Hito 2: Backend Multi-Tenant + Wrapper VoiceStudio
- [ ] Microservicio wrapper de VoiceStudio (`/api/v1/voice/clone`, `/api/v1/voice/tts`, `/api/v1/voice/asr`).
- [ ] Middleware multi-tenant (resolución por subdominio, header `X-Tenant-ID` y JWT).
- [ ] Endpoints CRUD:
  - Autenticación y control de acceso RBAC (Superadmin, Tenant Admin, Operador).
  - Gestión de tenants y cuotas.
  - Catálogo de voces clonadas por tenant.
  - Motor de precios geográficos (`country_pricing`) con cálculo dinámico USD → Moneda local y redondeo psicológico.
  - Reuniones bilingües y pipelines de traducción/transcripción de audio.
- [ ] Suite completa de tests unitarios con `pytest` en `backend/tests/`.

### 📍 Hito 3: Frontend Responsive (Next.js + TailwindCSS)
- [ ] Landing page pública con detección de país por IP y selector de moneda en tiempo real.
- [ ] Panel **Superadmin**:
  - Matriz global de precios por país, tipos de cambio y márgenes.
  - Administración de inquilinos y monitor de métricas/consumo de audio.
  - Plantillas de integraciones globales.
- [ ] Panel **Cliente / Tenant**:
  - Wizard de configuración de IA (OpenAI, Anthropic, Gemini, prompts del sistema).
  - Estudio de TTS interactivo y generador de audio.
  - Gestor de clonación de voz (subida de muestra de audio, previsualización).
  - Sala y configuración de reuniones bilingües.
  - Configuración propia de integraciones (WhatsApp, Telegram, SMTP, Pasarelas de pago).
- [ ] Diseño 100% responsive probado en vistas móvil (375px) y escritorio (1440px).

### 📍 Hito 4: Integraciones de Terceros
- [ ] Módulos de IA desacoplados (OpenAI, Anthropic Claude, Google Gemini).
- [ ] Mensajería omnicanal: WhatsApp Cloud API y Telegram Bot por inquilino.
- [ ] Notificaciones transaccionales: Servidor SMTP personalizable por tenant.
- [ ] Pasarelas de pago con precios en moneda local: Stripe, MercadoPago y Wompi.

### 📍 Hito 5: Infraestructura, Despliegue y Validación
- [ ] Dockerización completa (`docker-compose.yml`, Dockerfiles multi-stage).
- [ ] Script de despliegue automatizado para el servidor `server@192.168.2.25:2210` en `~/voice`.
- [ ] Configuración del túnel Cloudflare para exponer `voice.e-misario.com`.
- [ ] Pruebas E2E y de aislamiento multi-tenant.
- [ ] Verificación exhaustiva de criterios en `VALIDATION.md` (Iteración 1 y 2).
