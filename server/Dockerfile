# API Karla Angel Joias — Node + Express + SQLite (better-sqlite3)
FROM node:20-alpine

# better-sqlite3 precisa compilar código nativo
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
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
