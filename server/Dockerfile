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
# node-gyp puro não recompila de verdade (só faz "touch" nos stamps, sem
# gerar o binário final) porque pula a etapa própria do pacote que prepara
# o código-fonte do SQLite antes de compilar. "npm rebuild
# --build-from-source" é o mecanismo correto e documentado do próprio
# better-sqlite3 para isso — confirmado necessário via diagnóstico em
# produção (o binário pré-compilado trava com SIGSEGV nesta versão do Node).
RUN npm rebuild better-sqlite3 --build-from-source
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
