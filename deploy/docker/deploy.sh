#!/usr/bin/env bash
# Deploy do site Karla Angel Joias como container Docker, registrado no
# kamal-proxy que já roda no servidor (mesmo proxy que serve o
# fusion-beef-web — este script NUNCA toca no service "fusion-beef-web").
#
# Rodar dentro do servidor, de dentro da pasta do repositório:
#   cd /var/www/karlaangeljoias/repo && git pull && bash deploy/docker/deploy.sh
#
# Primeira execução: cria o container e registra a rota.
# Execuções seguintes: builda a nova imagem e faz o kamal-proxy trocar
# de container com zero downtime (ele só troca o tráfego depois que o
# novo container responde saudável em /up).

set -euo pipefail
cd "$(dirname "$0")/../.."   # volta pra raiz do repo

IMAGE_NAME="karlaangeljoias-web"
CONTAINER_NAME="karlaangeljoias-web-$(date +%s)"
NETWORK="kamal"
SERVICE_NAME="karlaangeljoias"
HOST_PRIMARY="karlaangeljoias.com.br"
HOST_WWW="www.karlaangeljoias.com.br"

echo "==> Build da imagem Docker (inclui npm install + vite build)"
docker build -t "$IMAGE_NAME" -f deploy/docker/Dockerfile .

echo "==> Subindo novo container ($CONTAINER_NAME) na rede $NETWORK"
docker run -d \
  --name "$CONTAINER_NAME" \
  --network "$NETWORK" \
  --restart unless-stopped \
  --label "app=karlaangeljoias" \
  "$IMAGE_NAME"

echo "==> Registrando no kamal-proxy (zero downtime — só troca quando o novo container estiver saudável)"
docker exec kamal-proxy kamal-proxy deploy "$SERVICE_NAME" \
  --target "${CONTAINER_NAME}:80" \
  --host "$HOST_PRIMARY" \
  --host "$HOST_WWW" \
  --health-check-path /up \
  --tls

echo "==> Limpando containers antigos deste app (mantém só o atual)"
docker ps -a --filter "label=app=karlaangeljoias" --format '{{.Names}}' \
  | grep -v "^${CONTAINER_NAME}$" \
  | xargs -r docker rm -f

echo "==> Limpando imagens antigas não usadas (não mexe nas imagens do fusionbeef)"
docker image prune -f --filter "label=app=karlaangeljoias" >/dev/null 2>&1 || true

echo ""
echo "✅ Deploy concluído. Rotas atuais no kamal-proxy:"
docker exec kamal-proxy kamal-proxy list
