# Painel administrativo Karla Angel Joias — build multi-stage
# Build a partir da pasta admin/: docker build -t karlaangeljoias-admin -f Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
