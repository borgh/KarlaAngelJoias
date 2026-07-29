#!/usr/bin/env bash
# Primeira instalação do site Karla Angel Joias no servidor.
# Este servidor usa Kamal (kamal-proxy) para rotear domínios — NÃO usa
# Nginx no host. Este script clona o repositório e faz o primeiro
# deploy via Docker, registrando a rota no kamal-proxy já existente.
#
# Uso: curl -fsSL https://raw.githubusercontent.com/borgh/KarlaAngelJoias/main/deploy/docker/setup.sh | bash
# ou copie o arquivo e rode: bash setup.sh

set -euo pipefail

APP_DIR="/var/www/karlaangeljoias"
REPO_DIR="$APP_DIR/repo"
REPO_URL="https://github.com/borgh/KarlaAngelJoias.git"

echo "==> Verificando pré-requisitos"
command -v docker >/dev/null || { echo "docker não encontrado"; exit 1; }
docker inspect kamal-proxy >/dev/null 2>&1 || { echo "container kamal-proxy não encontrado — aborta, algo está diferente do esperado"; exit 1; }
docker network inspect kamal >/dev/null 2>&1 || { echo "rede docker 'kamal' não encontrada — aborta"; exit 1; }

echo "==> Clonando/atualizando o repositório"
mkdir -p "$APP_DIR"
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR" && git pull
else
  git clone "$REPO_URL" "$REPO_DIR"
fi

echo "==> Rodando o deploy via Docker + kamal-proxy"
cd "$REPO_DIR"
bash deploy/docker/deploy.sh
