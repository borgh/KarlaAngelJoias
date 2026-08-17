# PWA do painel admin

## Onde fica o código

- `admin/vite.config.ts` — configuração do `vite-plugin-pwa`.
- `admin/src/sw.js` — service worker customizado (código-fonte; o build gera `dist/sw.js` final).
- `admin/public/pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png` — ícones, gerados na identidade visual da marca (verde-joia + dois elos dourados, mesmo desenho do favicon).
- `admin/src/components/InstallPwaButton.tsx` — botão de instalação.

## Por que `injectManifest`, não `generateSW`

O modo padrão do `vite-plugin-pwa` (`generateSW`) gera o service worker inteiro automaticamente, mas **não permite código customizado** — e notificações push exigem handlers próprios (`self.addEventListener('push', ...)`, `notificationclick`). Por isso o projeto usa `strategies: 'injectManifest'`, com um arquivo fonte próprio (`admin/src/sw.js`) que:
1. Faz o precache do Workbox (`precacheAndRoute(self.__WB_MANIFEST)`) — igual o modo automático.
2. Adiciona os handlers de `push` e `notificationclick` por cima.

## `/api/*` nunca é cacheado

O precache do Workbox só inclui os arquivos do build (JS, CSS, HTML, ícones) — chamadas pra `/api/*` e `/uploads/*` **não fazem parte do manifesto do Workbox**, então nunca são interceptadas pelo service worker; sempre vão direto pra rede. O painel nunca mostra dado desatualizado por causa de cache.

## Botão de instalação

`InstallPwaButton.tsx` escuta o evento `beforeinstallprompt` (Chrome/Android — dispara automaticamente quando os critérios de instalabilidade são satisfeitos) e mostra um botão "Instalar app" na barra lateral quando disponível. No iOS/Safari, que **nunca dispara esse evento**, mostra uma instrução manual ("Compartilhar → Adicionar à Tela de Início").

## Layout responsivo (pré-requisito da PWA)

Antes de virar PWA, o layout do admin era uma sidebar fixa que não funcionava em telas pequenas. `admin/src/components/Layout.tsx` foi reescrito com:
- Sidebar fixa em telas grandes (`lg:flex`), escondida por padrão em telas menores.
- Gaveta deslizante (`fixed inset-0` + overlay) no celular, aberta pelo botão hambúrguer da barra superior.
- Tabelas (Produtos, Usuários) com `overflow-x-auto` + `min-width` na tag `<table>`, pra rolar horizontalmente em vez de espremer ou vazar da tela.
