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
