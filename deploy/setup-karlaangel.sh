#!/usr/bin/env bash
# Setup inicial do site Karla Angel Joias no servidor da Digital Ocean.
# Roda uma vez só (na primeira instalação). Para atualizações depois
# disso, use o comando de "update" mostrado no final.
#
# Uso: cole este arquivo no servidor (ex: nano setup-karlaangel.sh, cole,
# salve) e rode: bash setup-karlaangel.sh

set -euo pipefail

APP_DIR="/var/www/karlaangeljoias"
REPO_DIR="$APP_DIR/repo"
REPO_URL="https://github.com/borgh/KarlaAngelJoias.git"
NGINX_CONF="karlaangeljoias.com.br.conf"

echo "==> 1/5 Criando pasta e clonando o repositório"
mkdir -p "$APP_DIR"
if [ -d "$REPO_DIR/.git" ]; then
  echo "    repo já existe em $REPO_DIR, pulando clone (rode o update no final se quiser atualizar)"
else
  git clone "$REPO_URL" "$REPO_DIR"
fi

echo "==> 2/5 Instalando dependências e gerando build"
cd "$REPO_DIR"
npm install
npm run build

echo "==> 3/5 Linkando a pasta dist"
if [ -L "$APP_DIR/dist" ] || [ -e "$APP_DIR/dist" ]; then
  echo "    $APP_DIR/dist já existe, mantendo como está"
else
  ln -s "$REPO_DIR/dist" "$APP_DIR/dist"
fi

echo "==> 4/5 Instalando a config do Nginx (isolada, não mexe em outros sites)"
cp "$REPO_DIR/deploy/nginx/$NGINX_CONF" "/etc/nginx/sites-available/$NGINX_CONF"
if [ ! -L "/etc/nginx/sites-enabled/$NGINX_CONF" ]; then
  ln -s "/etc/nginx/sites-available/$NGINX_CONF" "/etc/nginx/sites-enabled/$NGINX_CONF"
fi

echo "==> Testando a configuração completa do Nginx (todos os sites, incluindo fusionbeef)"
if nginx -t; then
  echo "==> 5/5 Configuração válida. Recarregando o Nginx"
  systemctl reload nginx
  echo ""
  echo "✅ Site instalado em $APP_DIR/dist e Nginx recarregado."
  echo "   Falta: apontar o DNS de karlaangeljoias.com.br para este servidor"
  echo "   e depois rodar: certbot --nginx -d karlaangeljoias.com.br -d www.karlaangeljoias.com.br"
else
  echo ""
  echo "❌ nginx -t falhou — o Nginx NÃO foi recarregado, nada foi afetado."
  echo "   Revise o erro acima antes de tentar de novo."
  exit 1
fi
