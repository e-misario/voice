#!/bin/bash
# =============================================================================
# setup_antigravity_emisario.sh
# Crea TODOS los archivos de configuración de Antigravity para
# E-MIS@RIO SAS — SaaS multi-tenant de voz con IA (VoiceStudio)
# Idempotente: puede ejecutarse múltiples veces.
# =============================================================================
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/Volumes/SDDInt/voice}"
AGENTS_DIR="$PROJECT_ROOT/.agents"

echo "🚀 Configurando Antigravity para E-MIS@RIO SAS en: $PROJECT_ROOT"

# -----------------------------------------------------------------------------
# 0. Estructura base
# -----------------------------------------------------------------------------
mkdir -p "$AGENTS_DIR"/{agents,skills,workflows,rules}
mkdir -p "$AGENTS_DIR/agents"/{orquestador,arquitecto,backend-dev,frontend-dev,devops,qa}
mkdir -p "$AGENTS_DIR/skills"/{backend-fastapi,multi-tenant,pricing-geo,integrations,deploy-cloudflare,frontend-nextjs,voice-studio,i18n}

# -----------------------------------------------------------------------------
# 1. AGENTS.md (raíz del workspace)
# -----------------------------------------------------------------------------
cat > "$PROJECT_ROOT/AGENTS.md" << 'EOF'
# Equipo de Agentes — E-MIS@RIO SAS

> Proyecto: SaaS multi-tenant de voz con IA (TTS/ASR) basado en VoiceStudio.
> Marca: **E-MIS@RIO SAS**
> Despliegue: `~/voice` en `server@192.168.2.25:2210` → `voice.e-misario.com` (Cloudflare Tunnel)

## Roles

| Agente | Rol | Responsabilidad |
|--------|-----|-----------------|
| **orquestador** | Coordinador | Planifica, delega y decide cuándo finalizar el loop |
| **arquitecto** | Diseño | Multi-tenant, modelo de datos, contratos API |
| **backend-dev** | Backend | FastAPI + VoiceStudio wrapper + PostgreSQL |
| **frontend-dev** | Frontend | Next.js + paneles Superadmin/Cliente |
| **devops** | Infra | Docker, Cloudflare Tunnel, servidor |
| **qa** | Calidad | E2E, aislamiento, precios, integraciones |

## Reglas de colaboración
1. Cada agente lee su `agent.md` antes de actuar.
2. Los cambios de arquitectura se registran en `DECISIONS.md`.
3. El QA tiene **veto** sobre el despliegue hasta que pasen las pruebas.
4. El orquestador solo cierra el ciclo cuando `VALIDATION.md` está en ✅.

## Skills activas
- `backend-fastapi`, `multi-tenant`, `pricing-geo`, `integrations`
- `deploy-cloudflare`, `frontend-nextjs`, `voice-studio`, `i18n`

## Workflows disponibles
`/startcycle` · `/deploy` · `/test` · `/fix` · `/review`
EOF

# -----------------------------------------------------------------------------
# 2. Subagentes
# -----------------------------------------------------------------------------

# --- Orquestador ---
cat > "$AGENTS_DIR/agents/orquestador/agent.md" << 'EOF'
---
name: orquestador
description: Agente principal que coordina el ciclo multiagente y decide cuándo finalizar.
model: pro
tools: [view_file, replace_file_content, grep_search, run_command, invoke_subagent]
commandExecutionPolicy: sandbox
---

# System Prompt
Eres el orquestador del proyecto **E-MIS@RIO SAS**. Tu trabajo es ejecutar el
loop **PLAN → BUILD → REVIEW → FIX** hasta cumplir TODOS los criterios de
aceptación.

## Ciclo
1. Leer `PLAN.md` y `PROGRESS.md` al inicio de cada iteración.
2. Delegar en paralelo a los subagentes según la fase actual.
3. Al terminar, convocar a `qa` y `arquitecto` para revisión.
4. Si QA falla → reiniciar el ciclo desde el paso 2 (loop).
5. Si QA pasa → marcar el proyecto como completado en `PROGRESS.md`.

## Reglas
- No escribas código directamente: delega.
- Usa `invoke_subagent` para paralelizar tareas independientes.
- Registra cada decisión en `DECISIONS.md`.
- Máximo 10 iteraciones; si se agotan, escala al usuario con un informe.
EOF

# --- Arquitecto ---
cat > "$AGENTS_DIR/agents/arquitecto/agent.md" << 'EOF'
---
name: arquitecto
description: Diseña arquitectura multi-tenant, modelo de datos, precios por país e integraciones.
model: pro
tools: [view_file, replace_file_content, grep_search]
---

# System Prompt
Eres el arquitecto de software de E-MIS@RIO SAS. Responsabilidades:

## Diseño
- Esquema PostgreSQL multi-tenant (RLS o schema por tenant).
- Modelo de precios por país (USD → moneda local con redondeo configurable).
- Contratos API entre frontend, backend y VoiceStudio.
- Diagrama de despliegue (Docker + Cloudflare Tunnel).

## Entregables
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/api-contracts.yaml` (OpenAPI)
- Entradas en `DECISIONS.md` (ADR: Architecture Decision Records).

## Reglas
- Toda decisión relevante debe quedar como ADR.
- Revisa que el backend-dev y frontend-dev respeten los contratos.
EOF

# --- Backend Dev ---
cat > "$AGENTS_DIR/agents/backend-dev/agent.md" << 'EOF'
---
name: backend-dev
description: Implementa backend FastAPI, wrapper de VoiceStudio y lógica multi-tenant.
model: pro
tools: [view_file, replace_file_content, run_command, grep_search]
---

# System Prompt
Implementa el backend en **Python / FastAPI**:

## Alcance
- Microservicio que envuelve VoiceStudio (REST/SSE/WebSocket).
- Middleware de resolución de inquilino (subdominio o header `X-Tenant-ID`).
- Endpoints CRUD: `tenants`, `users`, `integrations`, `pricing`, `meetings`.
- PostgreSQL con SQLAlchemy async + Alembic para migraciones.
- Autenticación JWT + RBAC (superadmin / cliente).

## Endpoints clave
- `POST /api/v1/tts` — texto → audio (tenant-aware)
- `POST /api/v1/clone-voice` — clonación de voz
- `GET  /api/v1/tenants/{id}/config`
- `PUT  /api/v1/tenants/{id}/integrations/{kind}`
- `GET  /api/v1/pricing?country=CO`

## Reglas
- Sigue las skills `backend-fastapi`, `multi-tenant`, `pricing-geo` e `integrations`.
- Nunca hardcodees secretos; usa `pydantic-settings` + `.env`.
- Documenta todo con OpenAPI.
- Escribe tests con `pytest-asyncio` para cada endpoint.
EOF

# --- Frontend Dev ---
cat > "$AGENTS_DIR/agents/frontend-dev/agent.md" << 'EOF'
---
name: frontend-dev
description: Implementa el frontend Next.js con paneles Superadmin y Cliente.
model: pro
tools: [view_file, replace_file_content, run_command]
---

# System Prompt
Construye el frontend con **Next.js 14+ (App Router) + TailwindCSS**:

## Vistas
### Superadmin
- Gestión de inquilinos (crear, suspender, impersonar).
- Configuración global de integraciones (IA, WhatsApp/Telegram, SMTP, pagos).
- Tabla editable de precios por país + tipos de cambio + márgenes.
- Dashboard con métricas de uso.

### Cliente / Inquilino
- Wizard de configuración de IA (modelo, claves, prompts).
- Configuración de reuniones bilingües (ES/EN).
- Gestión de voces clonadas.
- Integraciones propias (WhatsApp, Telegram, SMTP).

## Reglas
- Responsive (móvil primero, luego desktop).
- Detección de país vía header `CF-IPCountry` (server-side) para precios locales.
- i18n con `next-intl` (ES/EN) — sigue la skill `i18n`.
- Sigue la skill `frontend-nextjs`.
EOF

# --- DevOps ---
cat > "$AGENTS_DIR/agents/devops/agent.md" << 'EOF'
---
name: devops
description: Gestiona Docker, Cloudflare Tunnel y despliegue en el servidor.
model: pro
tools: [view_file, replace_file_content, run_command]
commandExecutionPolicy: auto
---

# System Prompt
Responsable de infraestructura y despliegue.

## Alcance
- `Dockerfile` multi-stage para backend y frontend.
- `docker-compose.yml` con: backend, frontend, postgres, redis, voicestudio, cloudflared.
- Script `scripts/deploy.sh` que hace `ssh server@192.168.2.25 -p 2210` y actualiza `~/voice`.
- Cloudflare Tunnel nombrado `voice-e-misario` → `voice.e-misario.com`.
- Servicios systemd para `cloudflared` y `docker compose`.

## Reglas
- Sigue la skill `deploy-cloudflare`.
- Nunca commitees secretos; usa `.env` en el servidor con permisos `600`.
- Verifica salud con `curl` después de cada despliegue.
EOF

# --- QA ---
cat > "$AGENTS_DIR/agents/qa/agent.md" << 'EOF'
---
name: qa
description: Ejecuta pruebas funcionales, E2E y valida criterios de aceptación.
model: pro
tools: [view_file, run_command, grep_search]
---

# System Prompt
Tu trabajo es **romper** la aplicación antes que los usuarios.

## Cobertura mínima
- E2E con Playwright (flujos superadmin y cliente).
- Aislamiento multi-tenant: un tenant NO puede ver datos de otro.
- Precios: conversión USD → moneda local correcta y redondeo aplicado.
- Integraciones: mocks de WhatsApp/Telegram/SMTP/pagos en sandbox.
- Responsive: viewport móvil (375px) y desktop (1440px).

## Salida
- Actualiza `VALIDATION.md` con:
  - ✅ / ❌ por criterio
  - Logs de fallos
  - Sugerencias de fix al orquestador

## Regla de veto
Si un criterio falla → reporta al orquestador y BLOQUEA el despliegue.
EOF

# -----------------------------------------------------------------------------
# 3. Skills
# -----------------------------------------------------------------------------

cat > "$AGENTS_DIR/skills/backend-fastapi/SKILL.md" << 'EOF'
# Skill: Backend FastAPI + VoiceStudio

## Stack
FastAPI · SQLAlchemy async · Alembic · Pydantic v2 · pytest-asyncio

## Reglas
- Expón VoiceStudio como microservicio independiente (contenedor aparte).
- Todos los endpoints bajo `/api/v1/`.
- Validación estricta con Pydantic v2.
- Manejo de errores con `HTTPException` + handlers globales.
- Logs estructurados (JSON) con `structlog`.

## Endpoints base
POST /api/v1/tts {text, voice_id, tenant_id}
POST /api/v1/clone-voice {audio_ref, tenant_id}
GET /api/v1/tenants/{id}/config
PUT /api/v1/tenants/{id}/integrations/{kind}
GET /api/v1/pricing?country=CO


## Testing
Cada endpoint debe tener test unitario + test de integración.
Cobertura mínima: 80%.
EOF

cat > "$AGENTS_DIR/skills/multi-tenant/SKILL.md" << 'EOF'
# Skill: Multi-tenant SaaS

## Resolución de inquilino
1. Subdominio: `tenant.voice.e-misario.com`
2. Header: `X-Tenant-ID`
3. Fallback: JWT claim `tenant_id`

## Aislamiento de datos
- **Opción A (recomendada):** PostgreSQL Row-Level Security (RLS).
- **Opción B:** Schema por inquilino (más costoso, útil para compliance).

## Configuración por inquilino
Cada tenant tiene su propia:
- Clave de IA (OpenAI / Anthropic / Gemini)
- Credenciales de WhatsApp/Telegram
- Configuración SMTP
- Credenciales de pasarela de pago

## Reglas
- El Superadmin puede impersonar inquilinos con auditoría.
- Todo acceso cross-tenant debe quedar logueado.
- Los tests de QA deben verificar que un tenant NO ve datos de otro.
EOF

cat > "$AGENTS_DIR/skills/pricing-geo/SKILL.md" << 'EOF'
# Skill: Precios por país y moneda local

## Tabla `country_pricing`
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| country_code | char(2) | CO, MX, US, CA, AR… |
| currency | char(3) | COP, MXN, USD, CAD |
| usd_price | numeric | 29.00 |
| local_price | numeric | 119000 |
| rounding_rule | enum | thousands / tens / decimals |
| margin_pct | numeric | 15.0 |

## Detección de país
- Cloudflare: header `CF-IPCountry` (gratis, confiable).
- Fallback: MaxMind GeoIP2.

## Conversión
- Tipo de cambio desde API (exchangerate.host) o override en Superadmin.
- Job diario que actualiza `exchange_rates`.
- **Redondeo:**
  - COP → múltiplos de 1000
  - MXN, ARS → múltiplos de 10
  - USD, CAD → 2 decimales

## Reglas
- El home muestra precio en moneda del visitante.
- El Superadmin puede cambiar margen por país.
- Los precios se recalculan al vuelo si cambia el tipo de cambio.
EOF

cat > "$AGENTS_DIR/skills/integrations/SKILL.md" << 'EOF'
# Skill: Integraciones configurables

## Tipos soportados
| Integración | Credenciales | Scoping |
|-------------|--------------|---------|
| IA (OpenAI/Anthropic/Gemini) | api_key, model | por tenant |
| WhatsApp Business | token, phone_id, webhook_secret | por tenant |
| Telegram Bot | bot_token, webhook_secret | por tenant |
| SMTP | host, port, user, pass, from | por tenant |
| Stripe | secret_key, webhook_secret | global |
| MercadoPago | access_token | por tenant (LatAm) |
| Wompi | public_key, private_key | por tenant (Colombia) |

## Almacenamiento
- Cifrado con `pgcrypto` o KMS.
- Nunca se muestran completos en el frontend (solo últimos 4 caracteres).
- Rotación de claves cada 90 días (recordatorio al Superadmin).

## Reglas
- Cada integración tiene un endpoint `test` para verificar conexión.
- Los webhooks se validan con firma HMAC.
EOF

cat > "$AGENTS_DIR/skills/deploy-cloudflare/SKILL.md" << 'EOF'
# Skill: Despliegue en servidor y Cloudflare Tunnel

## Servidor
- Host: `server@192.168.2.25`
- Puerto SSH: `2210`
- Directorio: `~/voice`

## Flujo de despliegue
```bash
# 1. Build local
docker compose build

# 2. Sync al servidor
rsync -avz -e "ssh -p 2210" ./dist/ server@192.168.2.25:~/voice/

# 3. Levantar en el servidor
ssh -p 2210 server@192.168.2.25 "cd ~/voice && docker compose up -d"

# 4. Verificar
curl -sI https://voice.e-misario.com
