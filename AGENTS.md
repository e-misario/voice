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
