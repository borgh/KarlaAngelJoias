# Tela — Textos do site (`/conteudo`)

`admin/src/pages/Content.tsx`. Formulário longo, agrupado por seção (Hero, Nossa história, Contato) — cada campo é uma chave de `site-content` (ver `docs/api/site-content.md`). Um único botão "Salvar" manda todas as chaves de uma vez (`PUT /api/site-content/admin`).
