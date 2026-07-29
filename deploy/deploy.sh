#!/usr/bin/env bash
# Deploy manual do site Karla Angel para a Digital Ocean.
#
# Uso:
#   DEPLOY_HOST=159.65.167.133 DEPLOY_USER=root ./deploy/deploy.sh
#
# Pré-requisitos no servidor (ver deploy/README.md):
#   - diretório /var/www/karlaangeljoias/dist já criado
#   - config do Nginx já instalada (deploy/nginx/karlaangeljoias.com.br.conf)
#   - acesso SSH configurado (chave pública já autorizada no servidor)
#
# Este script NUNCA toca em /var/www de outros sites (ex: fusionbeef).

set -euo pipefail

HOST="${DEPLOY_HOST:?defina DEPLOY_HOST, ex: 159.65.167.133}"
USER="${DEPLOY_USER:-root}"
REMOTE_DIR="/var/www/karlaangeljoias"

echo "==> Instalando dependências e gerando build de produção"
npm ci
npm run build

echo "==> Enviando dist/ para ${USER}@${HOST}:${REMOTE_DIR}/dist"
rsync -az --delete \
  dist/ \
  "${USER}@${HOST}:${REMOTE_DIR}/dist/"

echo "==> Testando e recarregando o Nginx no servidor"
ssh "${USER}@${HOST}" 'sudo nginx -t && sudo systemctl reload nginx'

echo "==> Deploy concluído: https://karlaangeljoias.com.br"
