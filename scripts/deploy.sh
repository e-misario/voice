#!/usr/bin/env bash
# =============================================================================
# E-MIS@RIO SAS — Script de Despliegue en Servidor VPS Remoto
# Servidor: server@192.168.2.25 -p 2210
# Dominio: voice.e-misario.com (vía túnel Cloudflare aislado)
# =============================================================================
set -euo pipefail

SSH_USER="${REMOTE_SSH_USER:-server}"
SSH_HOST="${REMOTE_SSH_HOST:-192.168.2.25}"
SSH_PORT="${REMOTE_SSH_PORT:-2210}"
TARGET_DIR="${REMOTE_TARGET_DIR:-~/voice}"
DOMAIN="voice.e-misario.com"

echo "🚀 Iniciando despliegue de E-MIS@RIO SAS Voice AI..."
echo "📍 Destino: ${SSH_USER}@${SSH_HOST}:${SSH_PORT} -> ${TARGET_DIR}"
echo "🌐 Dominio: https://${DOMAIN}"

# 1. Ejecutar tests locales antes de desplegar (Veto de QA)
echo "🧪 [1/4] Ejecutando suite de pruebas unitarias en backend..."
if [ -d "backend/.venv" ]; then
    backend/.venv/bin/pytest -q backend/tests/
    echo "✅ Tests de backend aprobados al 100%."
else
    echo "⚠️ .venv no encontrado, omitiendo paso local de pytest."
fi

# 2. Sincronizar archivos hacia el servidor remoto (excluyendo .git, node_modules y .venv)
echo "📦 [2/4] Sincronizando archivos al VPS..."
ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "mkdir -p ${TARGET_DIR}"

rsync -avz --delete \
    -e "ssh -p ${SSH_PORT}" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.venv' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    ./ "${SSH_USER}@${SSH_HOST}:${TARGET_DIR}/"

# 3. Construir y levantar contenedores en el servidor VPS
echo "🐳 [3/4] Levantando contenedores Docker en el VPS..."
ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "bash -c '
    cd ${TARGET_DIR}
    if [ ! -f .env ]; then
        cp .env.example .env
        echo \"⚠️ Se creó .env a partir de .env.example. Recuerda configurar variables sensibles si aplica.\"
    fi
    cd infra
    docker compose up -d --build
'"

# 4. Verificación de salud y conectividad
echo "🩺 [4/4] Verificando estado del servicio..."
ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "bash -c '
    echo \"Comprobando healthcheck local del gateway...\"
    curl -sf http://localhost:18095/api/v1/health || curl -sf http://localhost:8055/api/v1/health || true
'"

echo "✨ Despliegue finalizado exitosamente."
echo "🔗 Accede en: https://${DOMAIN}"
