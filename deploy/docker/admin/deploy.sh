#!/usr/bin/env bash
# Deploy do painel administrativo, registrado no kamal-proxy com seu
# próprio domínio (admin.karlaangeljoias.com.br) e certificado TLS.
#
# Rodar a partir da pasta admin/: bash ../deploy/docker/admin/deploy.sh
# (ou deixe o deploy-all.sh chamar este script)

set -euo pipefail
cd "$(dirname "$0")/../../../admin"   # raiz de admin/

IMAGE_NAME="karlaangeljoias-admin"
CONTAINER_NAME="karlaangeljoias-admin-$(date +%s)"
NETWORK="kamal"
SERVICE_NAME="karlaangeljoias-admin"
HOST="admin.karlaangeljoias.com.br"

echo "==> Build da imagem do painel admin"
docker build -t "$IMAGE_NAME" .

echo "==> Subindo novo container ($CONTAINER_NAME)"
docker run -d \
  --name "$CONTAINER_NAME" \
  --network "$NETWORK" \
  --restart unless-stopped \
  --label "app=karlaangeljoias-admin" \
  "$IMAGE_NAME"

echo "==> Registrando no kamal-proxy"
docker exec kamal-proxy kamal-proxy deploy "$SERVICE_NAME" \
  --target "${CONTAINER_NAME}:80" \
  --host "$HOST" \
  --health-check-path /up \
  --tls

echo "==> Limpando containers antigos do admin"
docker ps -a --filter "label=app=karlaangeljoias-admin" --format '{{.Names}}' \
  | grep -v "^${CONTAINER_NAME}$" \
  | xargs -r docker rm -f

echo "✅ Painel admin no ar em https://${HOST}"
