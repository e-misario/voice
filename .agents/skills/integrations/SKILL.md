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
