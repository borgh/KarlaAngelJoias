# API — Carrossel (Instagram)

Itens de galeria genéricos, agrupados por um nome de carrossel (hoje só `instagram` é usado, mas o schema suporta outros).

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/carousels/:name` | — | Itens **ativos** desse carrossel, público |
| GET | `/api/carousels/:name/admin` | logado | Todos os itens (inclui inativos) |
| POST | `/api/carousels/:name/admin` | `canCreate` | Cria item nesse carrossel |
| PUT | `/api/carousels/items/:id/admin` | `canEdit` | Edita item (por id, não precisa do nome do carrossel) |
| DELETE | `/api/carousels/items/:id/admin` | `canDelete` | Exclui item |

## Campos

```
id, carousel,        // ex: 'instagram'
title, subtitle,      // legenda (opcional)
imageUrl,             // upload via /api/upload
linkUrl,               // opcional — se vazio, o site usa o link padrão do Instagram (contact.instagram_url)
sortOrder, isActive
```

Sem limite de itens — a seção "Acompanhe no Instagram" do site mostra **todos** os itens ativos (grid que quebra em várias linhas sozinho).
