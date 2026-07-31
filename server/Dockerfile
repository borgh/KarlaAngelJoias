# API Karla Angel Joias — Node + Express + SQLite (better-sqlite3)
#
# IMPORTANTE: usamos "bookworm-slim" (Debian/glibc), não "alpine" (musl).
# O better-sqlite3 tem código nativo compilado, e binários pré-compilados
# assumem glibc — em Alpine ele carrega sem erro (require funciona) mas
# trava com "Segmentation fault" ao abrir o banco de verdade. Debian
# evita essa classe inteira de bug.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
# O --build-from-source do npm não teve efeito neste pacote — confirmado via
# strace em produção que ele continuava carregando o binário pré-compilado
# (node_modules/better-sqlite3/prebuilds/linux-x64.node), que trava com
# Segmentation fault ao inicializar nesta versão exata do Node (incompatível
# com esta build/host). Forçamos a compilação manual com node-gyp — quando
# existe um build local em build/Release/, o carregador (node-gyp-build)
# sempre prefere ele em vez do prebuild.
RUN cd node_modules/better-sqlite3 && npx node-gyp rebuild
COPY src ./src

# /data (banco SQLite) e /app/uploads (imagens) são montados como volumes
# nomeados no deploy, para sobreviver a atualizações do container.
RUN mkdir -p /data /app/uploads
VOLUME ["/data", "/app/uploads"]

ENV DATA_DIR=/data
ENV UPLOAD_DIR=/app/uploads
ENV PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "node src/db/seed.js && node src/index.js"]
