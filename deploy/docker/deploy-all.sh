#!/usr/bin/env bash
# Deploy completo: API -> site público -> painel admin.
# A API sobe primeiro porque os outros dois dependem dela (proxy /api).
#
# Uso (a partir da raiz do repositório):
#   export JWT_SECRET=$(openssl rand -hex 32)      # só na 1ª vez, depois reaproveite o mesmo
#   export SEED_ADMIN_PASSWORD='SenhaForte123!'    # só define o admin na 1ª vez
#   bash deploy/docker/deploy-all.sh

set -euo pipefail
cd "$(dirname "$0")/../.."   # raiz do repositório

echo "########## 1/3 — API ##########"
bash deploy/docker/api/deploy.sh

echo ""
echo "########## 2/3 — Site público ##########"
bash deploy/docker/deploy.sh

echo ""
echo "########## 3/3 — Painel admin ##########"
bash deploy/docker/admin/deploy.sh

echo ""
echo "✅ Deploy completo. Rotas no kamal-proxy:"
docker exec kamal-proxy kamal-proxy list
