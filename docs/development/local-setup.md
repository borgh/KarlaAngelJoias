# Rodando localmente

O projeto tem 3 partes independentes: site público (raiz), API (`server/`) e painel admin (`admin/`). Rode os 3 em terminais separados.

```bash
# 1. API (porta 4000)
cd server
npm install
cp .env.example .env   # defina JWT_SECRET
npm run seed             # cria o banco, categorias/produtos de exemplo e o 1º admin
npm start

# 2. Site público (porta 5173), em outro terminal
npm install
npm run dev

# 3. Painel admin (porta 5174), em outro terminal
cd admin
npm install
npm run dev
```

Em desenvolvimento, tanto o site quanto o admin fazem proxy de `/api` e `/uploads` pra `http://localhost:4000` (configurado em `vite.config.ts` de cada um) — não precisa rodar Nginx localmente.

## Testar com dados limpos

```bash
rm -rf server/data server/uploads
cd server && npm run seed
```

## Build de produção (checar antes de publicar)

```bash
npm run build          # site público (raiz)
cd admin && npm run build
cd ../server && node --check src/index.js   # checagem de sintaxe rápida (não substitui testes)
```

## Testes funcionais com Playwright (opcional, usado durante o desenvolvimento)

O projeto não tem uma suíte de testes automatizados formal — cada funcionalidade nova foi validada manualmente com scripts Playwright ad-hoc durante o desenvolvimento (login, navegação, contagem de elementos renderizados, checagem de erros de console). Não há arquivos de teste versionados no repositório; se for adicionar testes de verdade no futuro, considerar Playwright Test ou Vitest.

## WhatsApp em ambiente local

Sem `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` configuradas, a integração de WhatsApp fica indisponível (a API responde `whatsappServerConfigured: false`, e a tela mostra aviso em vez do botão de conectar) — o resto do sistema funciona normalmente. Não é necessário ter uma Evolution API rodando localmente pra desenvolver o resto.
