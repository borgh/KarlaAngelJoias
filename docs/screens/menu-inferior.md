# Tela — Menu inferior / celular (`/menu-inferior`)

`admin/src/pages/MobileNavSettings.tsx`. Preferência pessoal (ver `docs/features/menu-inferior-pwa.md`), sem exigir `canManageUsers`. Lista os atalhos já selecionados (com botões de reordenar ▲▼ e remover ✕) + grid de opções disponíveis pra adicionar (desabilitadas ao atingir 4/4). Só aparece na gaveta lateral quando acessado no celular (`lg:hidden`), mas a rota funciona em qualquer tamanho de tela.
