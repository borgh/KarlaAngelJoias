# Carrossel do Instagram

**Não integra com a API do Instagram** — é uma galeria de fotos 100% manual, gerenciada em `/carrossel` no admin. O nome é só estético (a seção do site se chama "Acompanhe no Instagram", visual de grid parecido com um feed), mas nenhuma foto vem automaticamente de lá.

## Onde fica o código

- `admin/src/pages/Carousels.tsx` — CRUD dos itens.
- `src/components/InstagramStrip.tsx` — renderização no site público.
- `server/src/routes/carousels.js` — API.

## Por que não é automático

O Instagram bloqueia scraping/acesso automatizado ao perfil (retorna erro de robots.txt pra qualquer tentativa de fetch programático) — puxar posts de verdade exigiria a **API oficial da Meta** (Graph API), que precisa de conta Business/Criador de conteúdo, um App registrado no painel de desenvolvedores da Meta, e um token de acesso renovado periodicamente. Ficou definido como melhoria futura (mesma decisão vale pros números de seguidores/posts em "Nossa história", hoje editados manualmente em Textos do site).

## Cada item

Imagem (upload), legenda opcional, link opcional (se vazio, o clique cai no perfil do Instagram configurado em `contact.instagram_url`), e um toggle "Visível no site". Sem limite de quantidade — a seção mostra todos os itens ativos.
