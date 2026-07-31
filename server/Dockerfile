# API Karla Angel Joias — Node + Express + armazenamento JSON puro.
#
# IMPORTANTE: intencionalmente NÃO usamos nenhum pacote com código nativo
# compilado (como better-sqlite3). Depois de horas de diagnóstico em
# produção (segfaults do binário nativo do SQLite neste host específico,
# mesmo recompilando do zero), migramos para um armazenamento em JSON
# 100% JavaScript — elimina de vez essa classe de problema. Para a escala
# deste painel (catálogo de uma loja), isso é mais que suficiente.
FROM node:20-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

# /data (arquivo JSON) e /app/uploads (imagens) são montados como volumes
# nomeados no deploy, para sobreviver a atualizações do container.
RUN mkdir -p /data /app/uploads
VOLUME ["/data", "/app/uploads"]

ENV DATA_DIR=/data
ENV UPLOAD_DIR=/app/uploads
ENV PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "node src/db/seed.js && node src/index.js"]
