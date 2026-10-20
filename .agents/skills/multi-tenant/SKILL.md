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
