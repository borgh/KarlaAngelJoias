# API — Usuários administrativos

Toda a rota exige `canManageUsers` (`usersRouter.use(requireAuth, requirePermission('canManageUsers'))` em `server/src/routes/users.js`) — diferente de `/api/auth/bottom-nav-config`, que é preferência pessoal e não passa por aqui.

| Método | Caminho | Descrição |
|---|---|---|
| GET | `/api/users` | Lista todos os administradores |
| POST | `/api/users` | Cria usuário — `{ name, email, password (mín. 8), canCreate, canEdit, canDelete, canManageUsers }` |
| PUT | `/api/users/:id` | Edita — mesmos campos, todos opcionais; `password` vazio/omitido mantém a senha atual |
| DELETE | `/api/users/:id` | Exclui — não é possível excluir o próprio usuário logado |

## Regra de proteção

Não é possível remover a flag `canManageUsers` de si mesmo se você for o **último** usuário com essa permissão no sistema — impede o painel ficar sem ninguém capaz de gerenciar usuários. A checagem é feita em `PUT /api/users/:id` (ver `server/src/routes/users.js`).

## Campo `bottomNavConfig`

Existe no objeto de usuário (`string[]`, até 4 caminhos), mas é editado por `PUT /api/auth/bottom-nav-config` (não por aqui) — é preferência pessoal de cada um. Ver `docs/features/menu-inferior-pwa.md`.
