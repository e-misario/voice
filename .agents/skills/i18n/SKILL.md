# Skill: Internacionalización (i18n) & Localización Geo-Precios

## Alcance
- Soporte multilingüe en Frontend (Español / Inglés) mediante diccionarios estructurados.
- Detección de país vía Cloudflare `CF-IPCountry` o geolocalización IP con fallback regional.
- Formateo de moneda local adaptado a cada país:
  - Colombia: COP (redondeo a múltiplos de $1.000 COP)
  - México: MXN (redondeo a múltiplos de $10 MXN)
  - Argentina: ARS (redondeo a múltiplos de $10 ARS)
  - Estados Unidos: USD (formato 2 decimales $XX.99)
  - Canadá: CAD (formato 2 decimales $XX.99)
  - Otros LatAm / Global: USD o moneda local según matriz configurada en Superadmin.

## Reglas de Formato
- Todo precio en frontend debe utilizar `Intl.NumberFormat` con el locale y moneda correspondiente.
- Los textos de la UI deben estar externalizados en archivos de mensajes (`es.json`, `en.json`).
