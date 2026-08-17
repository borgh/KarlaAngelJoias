# API — Produtos e estoque

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/products` | — | Lista pública — só produtos com `isActive: true` |
| GET | `/api/products/admin` | logado | Lista completa (inclui inativos), com `effectiveMinStockThreshold` e `isLowStock` calculados |
| GET | `/api/products/admin/low-stock` | logado | Só os produtos com `isLowStock: true`, ordenados por quantidade |
| POST | `/api/products/admin` | `canCreate` | Cria produto |
| PUT | `/api/products/admin/:id` | `canEdit` | Edita produto (qualquer campo) |
| PATCH | `/api/products/admin/:id/stock` | `canEdit` | Ajuste rápido de estoque — `{ delta }` (soma/subtrai) ou `{ quantity }` (define valor exato) |
| DELETE | `/api/products/admin/:id` | `canDelete` | Exclui produto |

## Campos do produto

```
id, name, categoryId, price, badge, description, imageUrl,
isBestseller, isActive, sortOrder,
stockQuantity,            // quantidade atual em estoque
minStockThreshold,        // limite mínimo PRÓPRIO deste produto, ou null pra usar o da categoria/geral
notifyChannels,           // canais de alerta PRÓPRIOS ['push'|'email'|'whatsapp'], ou null pra usar o padrão
lowStockNotifiedAt,       // timestamp da última notificação disparada, ou null (ver deduplicação abaixo)
createdAt, updatedAt
```

Campos calculados só na resposta da API (nunca salvos): `effectiveMinStockThreshold` (resultado da hierarquia produto → categoria → geral) e `isLowStock` (`stockQuantity <= effectiveMinStockThreshold`).

## Checagem automática de estoque baixo

Toda vez que o estoque de um produto muda (criar, editar, ou `PATCH .../stock`), o backend chama `checkAndNotifyLowStock()` (`server/src/services/notify.js`) automaticamente — não é preciso chamar nada à parte. Ver `docs/features/gestao-de-estoque.md` para a hierarquia de limites e `docs/features/notificacoes-de-estoque.md` para como os canais são disparados.

**Deduplicação**: `lowStockNotifiedAt` só é preenchido na primeira vez que o estoque cruza o limite pra baixo — enquanto continuar baixo, novas edições não disparam notificação de novo. Volta a `null` assim que o estoque sobe de novo acima do limite, permitindo notificar de novo numa próxima queda.
