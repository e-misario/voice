# Reglas de Seguridad y Multi-Tenant

1. **Aislamiento Estricto de Inquilinos**:
   - Toda consulta a la base de datos DEBE estar parametrizada por `tenant_id`.
   - Prohibido el acceso cruzado entre tenants sin rol explícito de `superadmin`.
2. **Secretos y Credenciales**:
   - Claves de API de IA (OpenAI, Gemini, Anthropic), tokens de WhatsApp/Telegram, credenciales SMTP y de pasarelas de pago deben guardarse cifradas.
   - En respuestas JSON hacia el frontend, enmascarar llaves mostrando solo los últimos 4 dígitos.
3. **Comandos de Consola**:
   - Cumplir estrictamente la regla de NO ejecutar comandos destructivos sin confirmación explícita del usuario.
