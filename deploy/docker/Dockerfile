# Imagem do site Karla Angel Joias, para rodar como container isolado
# registrado no kamal-proxy já existente no servidor (mesmo mecanismo
# usado pelo fusion-beef-web, mas com service/host diferentes).

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
