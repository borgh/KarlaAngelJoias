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
# Força compilar os módulos nativos (better-sqlite3) a partir do código-fonte
# em vez de baixar um binário pré-compilado — evita incompatibilidade de ABI
# entre o binário pronto e esta versão exata do Node, que causava
# Segmentation fault ao abrir o banco (crash confirmado dentro do próprio
# binário do node, não do SQLite — ver histórico de diagnóstico).
ENV npm_config_build_from_source=true
RUN npm ci --omit=dev --build-from-source
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
