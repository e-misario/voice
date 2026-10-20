# Workflow: /deploy

## Descripción
Flujo de despliegue automatizado hacia el servidor remoto de E-MIS@RIO SAS (`server@192.168.2.25:2210`, directorio `~/voice`).

## Pasos
1. Validar que la suite de tests en `pytest` y validación de tipos frontend estén en verde (QA check).
2. Construir artefactos o verificar imágenes Docker (`docker-compose.yml`).
3. Empaquetar y sincronizar código vía rsync o git hacia el servidor remoto.
4. Reiniciar servicios en el servidor (`docker compose up -d --build`).
5. Verificar túnel Cloudflare y healthcheck en `https://voice.e-misario.com/api/health`.
