# Telas do admin — índice

Todas as rotas ficam dentro de `admin/src/App.tsx`, protegidas por `<ProtectedRoute>` (exige login; algumas exigem `canManageUsers` também).

| Rota | Tela | Permissão extra | Documento |
|---|---|---|---|
| `/login` | Login | — | [login.md](./login.md) |
| `/` | Dashboard (Visão geral) | — | [dashboard.md](./dashboard.md) |
| `/produtos` | Produtos | — | [produtos.md](./produtos.md) |
| `/estoque` | Estoque | — | [estoque.md](./estoque.md) |
| `/categorias` | Categorias | — | [categorias.md](./categorias.md) |
| `/conteudo` | Textos do site | — | [textos-do-site.md](./textos-do-site.md) |
| `/carrossel` | Carrossel Instagram | — | [carrossel.md](./carrossel.md) |
| `/notificacoes` | Notificações de estoque | — | [notificacoes.md](./notificacoes.md) |
| `/usuarios` | Usuários | `canManageUsers` | [usuarios.md](./usuarios.md) |
| `/menu-inferior` | Menu inferior (celular) | — | [menu-inferior.md](./menu-inferior.md) |

Ações de criar/editar/excluir dentro de cada tela ainda respeitam `canCreate`/`canEdit`/`canDelete` individualmente — os botões correspondentes somem da interface quando o usuário não tem a permissão (mas a API também valida no backend, nunca confia só na UI escondida).
