# Skill: Frontend Next.js 14+ (App Router) + TailwindCSS

## Stack
Next.js 14/15 (App Router), TypeScript estricto, TailwindCSS, Lucide Icons, React Hook Form, Zod.

## Estructura de Vistas
- `/` - Landing page pública con detección geográfica de país/moneda (header `CF-IPCountry` o geolocalización IP).
- `/admin` - Panel Superadmin:
  - `/admin/tenants`: Gestión de inquilinos (crear, suspender, cuotas).
  - `/admin/pricing`: Matriz de precios por país, monedas, tasas de cambio y márgenes.
  - `/admin/integrations`: Configuración global y plantillas de integraciones.
  - `/admin/metrics`: Monitor de uso, llamadas TTS/ASR por tenant.
- `/dashboard` - Panel Inquilino / Cliente:
  - `/dashboard/ai-config`: Selección de proveedor (OpenAI, Anthropic, Gemini), modelo, system prompt.
  - `/dashboard/voices`: Biblioteca de voces clonadas y personalizadas.
  - `/dashboard/tts`: Estudio interactivo de texto a voz con preview en tiempo real.
  - `/dashboard/meetings`: Configuración de reuniones bilingües y transcripción/traducción en tiempo real.
  - `/dashboard/integrations`: Credenciales propias (WhatsApp, Telegram, SMTP, pasarelas de pago).

## Requisitos de Diseño
- 100% Responsive (Mobile First 375px hasta Desktop 1440px+).
- Modo oscuro y estética premium E-MIS@RIO SAS (Slate/Indigo/Cyan).
- Tipografía moderna (Inter / Outfit).
- Componentes modulares y tipado TypeScript estricto en todos los props y estados.
