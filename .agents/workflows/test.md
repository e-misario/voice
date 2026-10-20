# Workflow: /test

## Descripción
Ejecución integral de pruebas de calidad:
1. Pruebas unitarias y de integración de backend con `pytest` en `backend/tests/`.
2. Verificación de aislamiento multi-tenant y seguridad de esquemas / RLS.
3. Pruebas de reglas de conversión y redondeo de precios por país.
4. Pruebas E2E / funcionales de flujos de cliente y superadmin.
5. Reporte de resultados a `VALIDATION.md`.
