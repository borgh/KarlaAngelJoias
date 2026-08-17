# API — Autenticação e sessão

Sessão via JWT em cookie httpOnly (`karlaangel_admin_session`), 12h de validade. Ver `server/src/auth.js`.

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | — | `{ email, password }` → seta cookie de sessão, devolve o usuário |
| POST | `/api/auth/logout` | logado | Limpa o cookie |
| GET | `/api/auth/me` | logado | Devolve o usuário da sessão atual |
| PUT | `/api/auth/bottom-nav-config` | logado | `{ bottomNavConfig: string[] }` (máx. 4) — preferência pessoal do menu inferior mobile, não exige `canManageUsers` (ver `docs/features/menu-inferior-pwa.md`) |

## Rate limiting

`/api/auth/login` tem limite simples de 20 tentativas por IP a cada 15 minutos (em memória, sem dependência externa — ver `server/src/index.js`).

## Segurança

- Senhas com bcrypt (10 rounds).
- Cookie: `httpOnly`, `sameSite: lax`, `secure` em produção.
- `JWT_SECRET` obrigatório (variável de ambiente) — o servidor recusa iniciar sem ele.
