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
