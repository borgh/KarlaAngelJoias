#!/usr/bin/env bash
# Deploy da API Karla Angel Joias. Container interno — não é registrado
# no kamal-proxy diretamente (não tem domínio público próprio); o site
# público e o admin acessam via proxy interno do Nginx de cada um.
#
# Dados persistem em volumes nomeados (karlaangeljoias-db e
# karlaangeljoias-uploads), então trocar o container não apaga nada.
#
# Rodar a partir da pasta server/: bash ../deploy/docker/api/deploy.sh
# (ou deixe o deploy-all.sh chamar este script)

set -euo pipefail
cd "$(dirname "$0")/../../../server"   # raiz de server/

IMAGE_NAME="karlaangeljoias-api"
CONTAINER_NAME="karlaangeljoias-api"
NETWORK="kamal"
DB_VOLUME="karlaangeljoias-db"
UPLOADS_VOLUME="karlaangeljoias-uploads"

if [ -z "${JWT_SECRET:-}" ]; then
  echo "❌ Defina a variável de ambiente JWT_SECRET antes de rodar este script."
  echo "   Ex: export JWT_SECRET=\$(openssl rand -hex 32)"
  exit 1
fi

echo "==> Garantindo volumes persistentes"
docker volume create "$DB_VOLUME" >/dev/null
docker volume create "$UPLOADS_VOLUME" >/dev/null

echo "==> Build da imagem da API"
docker build -t "$IMAGE_NAME" .

echo "==> Subindo novo container da API"
NEW_CONTAINER="${CONTAINER_NAME}-new"
docker rm -f "$NEW_CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$NEW_CONTAINER" \
  --network "$NETWORK" \
  --network-alias "$CONTAINER_NAME" \
  --restart unless-stopped \
  -v "${DB_VOLUME}:/data" \
  -v "${UPLOADS_VOLUME}:/app/uploads" \
  -e "JWT_SECRET=${JWT_SECRET}" \
  -e "NODE_ENV=production" \
  -e "CORS_ORIGINS=https://karlaangeljoias.com.br,https://admin.karlaangeljoias.com.br" \
  -e "SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-admin@karlaangeljoias.com.br}" \
  -e "SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD:-}" \
  "$IMAGE_NAME"

echo "==> Aguardando o novo container ficar saudável"
for i in $(seq 1 20); do
  if docker exec "$NEW_CONTAINER" node -e "fetch('http://localhost:4000/up').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "    saudável."
    break
  fi
  sleep 1
  if [ "$i" = "20" ]; then
    echo "❌ Container novo não respondeu a tempo — mantendo o antigo no ar."
    docker logs "$NEW_CONTAINER" --tail 50
    docker rm -f "$NEW_CONTAINER"
    exit 1
  fi
done

echo "==> Trocando o container antigo pelo novo"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rename "$NEW_CONTAINER" "$CONTAINER_NAME"

echo "✅ API no ar como '${CONTAINER_NAME}' na rede ${NETWORK}."
