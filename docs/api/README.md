# API — Índice

Base: `/api`. Todas as rotas administrativas exigem cookie de sessão válido (`requireAuth`) e, quando indicado, uma permissão específica do usuário logado (`requirePermission('canX')`). Rotas sem coluna de permissão são públicas (sem autenticação) ou só exigem estar logado, sem checagem extra.

| Domínio | Documento |
|---|---|
| Autenticação e sessão | [auth.md](./auth.md) |
| Produtos e estoque | [products.md](./products.md) |
| Categorias | [categories.md](./categories.md) |
| Textos do site | [site-content.md](./site-content.md) |
| Carrossel (Instagram) | [carousels.md](./carousels.md) |
| Usuários administrativos | [users.md](./users.md) |
| Upload de imagens | [upload.md](./upload.md) |
| Configurações e notificações | [settings.md](./settings.md) |
| Push (Web Push) | [push.md](./push.md) |

## Permissões — as 4 flags

Cada usuário administrativo tem 4 flags booleanas independentes (não um "role" fixo):

| Flag | Controla |
|---|---|
| `canCreate` | Criar produtos, categorias, itens de carrossel, usuários |
| `canEdit` | Editar produtos, categorias, textos do site, ajustar estoque, configurações de notificação |
| `canDelete` | Excluir produtos, categorias, itens de carrossel, usuários |
| `canManageUsers` | Acessar `/api/users/*` inteiro (listar/criar/editar/excluir outros administradores) e a preferência de menu inferior de outros — na prática, "é administrador geral" |

O primeiro usuário (criado pelo seed) tem as 4 como `true`. Ver `docs/api/users.md` para a regra que impede remover a última permissão de gestão de usuários do sistema.

## Padrão de resposta

Sucesso: `{ ...dados }` (ex: `{ product: {...} }`, `{ products: [...] }`).
Erro: `{ error: "mensagem em português, pronta pra mostrar ao usuário" }`, com status HTTP apropriado (400 validação, 401 não autenticado, 403 sem permissão, 404 não encontrado, 409 conflito, 500 erro interno).
