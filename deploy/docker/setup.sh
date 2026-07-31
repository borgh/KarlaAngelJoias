#!/usr/bin/env bash
# Primeira instalação completa: API, site público e painel admin.
# Gera automaticamente o JWT_SECRET e a senha do admin inicial na
# primeira execução, e imprime as credenciais no final — anote-as,
# elas não são mostradas de novo.
#
# Uso: curl -fsSL https://raw.githubusercontent.com/borgh/KarlaAngelJoias/main/deploy/docker/setup.sh | bash

set -euo pipefail

APP_DIR="/var/www/karlaangeljoias"
REPO_DIR="$APP_DIR/repo"
REPO_URL="https://github.com/borgh/KarlaAngelJoias.git"
SECRETS_FILE="$APP_DIR/.secrets"

echo "==> Verificando pré-requisitos"
command -v docker >/dev/null || { echo "docker não encontrado"; exit 1; }
docker inspect kamal-proxy >/dev/null 2>&1 || { echo "container kamal-proxy não encontrado — aborta"; exit 1; }
docker network inspect kamal >/dev/null 2>&1 || { echo "rede docker 'kamal' não encontrada — aborta"; exit 1; }

echo "==> Clonando/atualizando o repositório"
mkdir -p "$APP_DIR"
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR" && git pull
else
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

echo "==> Preparando segredos (JWT_SECRET e senha do admin)"
if [ -f "$SECRETS_FILE" ]; then
  echo "    arquivo de segredos já existe em $SECRETS_FILE, reaproveitando."
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
else
  JWT_SECRET=$(openssl rand -hex 32)
  SEED_ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '=+/')
  cat > "$SECRETS_FILE" << EOF
JWT_SECRET=$JWT_SECRET
SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD
EOF
  chmod 600 "$SECRETS_FILE"
  echo "    gerados e salvos em $SECRETS_FILE (permissão 600, só root lê)."
fi
export JWT_SECRET SEED_ADMIN_PASSWORD

echo "==> Rodando o deploy completo (API + site + admin)"
bash deploy/docker/deploy-all.sh

echo ""
echo "================================================================"
echo "✅ Instalação concluída."
echo ""
echo "Painel admin:  https://admin.karlaangeljoias.com.br"
echo "Usuário:       admin@karlaangeljoias.com.br"
echo "Senha inicial: $SEED_ADMIN_PASSWORD"
echo ""
echo "⚠️  Troque essa senha assim que fizer o primeiro login."
echo "    As credenciais também ficam salvas em: $SECRETS_FILE"
echo "================================================================"
