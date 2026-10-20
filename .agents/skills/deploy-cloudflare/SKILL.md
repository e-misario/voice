# Skill: Despliegue en servidor y Cloudflare Tunnel

## Servidor
- Host: `server@192.168.2.25`
- Puerto SSH: `2210`
- Directorio: `~/voice`

## Flujo de despliegue
```bash
# 1. Build local
docker compose build

# 2. Sync al servidor
rsync -avz -e "ssh -p 2210" ./dist/ server@192.168.2.25:~/voice/

# 3. Levantar en el servidor
ssh -p 2210 server@192.168.2.25 "cd ~/voice && docker compose up -d"

# 4. Verificar
curl -sI https://voice.e-misario.com
