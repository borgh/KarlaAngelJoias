# Arquitetura — visão geral

## Os 3 projetos, no mesmo repositório

```
karla-angel-joias/           (raiz do repositório GitHub: borgh/KarlaAngelJoias)
├── src/                     — site público (karlaangeljoias.com.br)
├── admin/                   — painel administrativo (admin.karlaangeljoias.com.br)
├── server/                  — API (interna, sem domínio próprio)
├── deploy/docker/           — Dockerfiles, nginx.conf, scripts de deploy
└── docs/                    — esta documentação
```

Cada um tem seu próprio `package.json`, é buildado e publicado como um **container Docker separado**, mas compartilham a mesma identidade visual e o mesmo repositório Git.

## Como os 3 se conectam

```
                    ┌─────────────────────┐
   visitante  ──────▶  karlaangeljoias.com.br  │ (site público, Nginx + React)
                    └──────────┬───────────┘
                               │ proxy /api/* e /uploads/*
                               ▼
                    ┌─────────────────────┐
   admin  ──────────▶ admin.karlaangeljoias.com.br │ (painel, Nginx + React)
                    └──────────┬───────────┘
                               │ proxy /api/* e /uploads/*
                               ▼
                    ┌─────────────────────┐
                    │  karlaangeljoias-api  │ (Node/Express, sem domínio público)
                    │  volume: dados JSON   │
                    │  volume: uploads      │
                    └──────────┬───────────┘
                               │ (rede vbma_network, só p/ WhatsApp)
                               ▼
                    ┌─────────────────────┐
                    │   vbma_evolution      │ (Evolution API, compartilhada com o VBMA)
                    └─────────────────────┘
```

Tanto o site público quanto o admin **não conversam com a API diretamente pelo domínio público** — cada um tem seu próprio Nginx fazendo proxy interno de `/api/*` e `/uploads/*` pro container `karlaangeljoias-api`, usando o nome do container na rede Docker (`kamal`). Isso significa:
- Nenhum CORS necessário (tudo parece "mesma origem" do ponto de vista do navegador)
- Cookies de sessão do admin funcionam normalmente
- O site público só chama endpoints **públicos** (GET sem autenticação) — mesmo que a URL `/api/...` seja alcançável, as rotas administrativas exigem cookie de sessão válido, que o site público nunca tem

## O servidor é compartilhado com outros dois sistemas

O droplet da Digital Ocean (`159.65.167.133`) também hospeda:
- **fusion-beef** (`fusionbeef.com.br`) — sistema Rails, implantado via Kamal
- **VBMA Sistemas** (`vbmasistemas.com.br` / `admin.vbmasistemas.com.br`) — outro projeto do mesmo desenvolvedor

**Não há Nginx no host controlando as portas 80/443** — quem faz isso é o container `kamal-proxy` (parte do Kamal, ferramenta de deploy do fusion-beef), que roteia por domínio (Host header) pra cada container. Todo container novo se registra nesse mesmo `kamal-proxy`, com **service name e host próprios** — o proxy recusa registrar um host que já pertence a outro serviço, então não há como um domínio "roubar" o tráfego de outro por acidente.

Ver checklist completo de isolamento em `README.md` (raiz do repo), seção "Checklist de segurança".

## Armazenamento de dados

A API usa um **arquivo JSON único** (`server/src/db/store.js`, persistido em `/data/karlaangel.json` dentro do volume Docker `karlaangeljoias-db`) como banco de dados — não SQLite, não Postgres. Essa é uma decisão deliberada, não um atalho: ver `troubleshooting.md` para o histórico completo do porquê (resumo: `better-sqlite3`, que tem código nativo compilado, causava Segmentation Fault consistente neste servidor específico, mesmo depois de múltiplas tentativas de correção).

Para a escala de um catálogo de uma loja (algumas dezenas de produtos, poucos usuários administrativos), isso é mais que suficiente, e elimina de vez uma classe inteira de problema (incompatibilidade de binário nativo).

**Coleções no arquivo JSON**: `users`, `categories`, `products`, `siteContent` (chave/valor), `carouselItems`, `pushSubscriptions`, `settings` (objeto único). Ver `docs/api/README.md` pra estrutura de cada uma.

## Integração com WhatsApp (Evolution API)

O container `karlaangeljoias-api` está conectado em **duas redes Docker**: `kamal` (padrão, todos os serviços) e `vbma_network` (só pra alcançar `vbma_evolution:8080`, o servidor Evolution API já usado pelo VBMA). A URL e a chave da API **nunca ficam no banco de dados nem no código** — só em variáveis de ambiente do container (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`), passadas no momento do deploy, seguindo o mesmo padrão do `JWT_SECRET`.

A Karla Angel Joias usa uma **instância própria** dentro desse mesmo servidor Evolution (`EVOLUTION_INSTANCE_NAME=karlaangeljoias`, separada da instância `vbma` do outro sistema) — conexões de WhatsApp completamente independentes, mesmo compartilhando a infraestrutura. Ver `docs/features/notificacoes-de-estoque.md`.

## Deploy

Ver `README.md` (raiz do repo) para o passo a passo completo. Resumo dos scripts:

| Script | O que faz |
|---|---|
| `deploy/docker/setup.sh` | Primeira instalação — gera `JWT_SECRET`/senha do admin, clona o repo, roda o deploy completo |
| `deploy/docker/deploy-all.sh` | Builda e sobe os 3 (API → site → admin), nessa ordem |
| `deploy/docker/api/deploy.sh` | Só a API — zero-downtime (sobe novo container, espera saudável, só então troca) |
| `deploy/docker/deploy.sh` | Só o site público |
| `deploy/docker/admin/deploy.sh` | Só o admin |

Segredos ficam em `/var/www/karlaangeljoias/.secrets` no servidor (nunca no git): `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_DOCKER_NETWORK`.
