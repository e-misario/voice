# Workflow: /fix

## Descripción
Subrutina de corrección rápida cuando el agente QA encuentra fallos en `VALIDATION.md`:
1. Diagnosticar la causa raíz a partir de los logs de error de QA.
2. Delegar el parche al agente responsable (`backend-dev`, `frontend-dev` o `devops`).
3. Re-ejecutar pruebas focalizadas hasta asegurar resolución sin regresiones.
