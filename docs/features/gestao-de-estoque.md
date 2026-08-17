# Gestão de estoque

## Onde fica o código

- `server/src/services/notify.js`, função `resolveStockRules()` — a hierarquia de limites.
- `admin/src/pages/Stock.tsx` — tela `/estoque` (lista, busca, filtro, ajuste rápido, modal de configuração por produto).
- `admin/src/pages/Products.tsx` — campo de estoque inicial no formulário de produto.
- `admin/src/pages/Categories.tsx` — padrões de estoque por categoria.
- `admin/src/pages/NotificationSettings.tsx` — padrão geral (global).

## Hierarquia de limite mínimo e canais de alerta

**Produto → Categoria → Padrão geral**, nessa ordem — cada nível só "vence" o de cima se tiver um valor **explicitamente definido** (não `null`):

```js
// server/src/services/notify.js
const threshold =
  product.minStockThreshold ?? category?.minStockThreshold ?? settings.globalMinStockThreshold ?? 0

const channels =
  (product.notifyChannels?.length > 0 && product.notifyChannels) ||
  (category?.notifyChannels?.length > 0 && category.notifyChannels) ||
  settings.globalNotifyChannels ||
  []
```

Isso permite três formas de configurar, escolhidas por quem administra:
1. **Nada configurado em lugar nenhum** → usa o padrão geral (`Notificações → Padrão geral de estoque`).
2. **Categoria com valor próprio** → todos os produtos dela usam esse valor, a não ser que tenham o próprio.
3. **Produto com valor próprio** → sempre vence, independente do resto.

Na tela de Estoque, a coluna "Limite mín." mostra o valor **efetivo** (calculado pela API, campo `effectiveMinStockThreshold`), com a legenda "(padrão)" quando o valor vem herdado (produto não tem valor próprio).

## Ajuste de estoque

Três formas, todas passando por `PATCH /api/products/admin/:id/stock` (nunca editando `stockQuantity` direto por `PUT`, embora isso também funcione e também dispare a checagem):

- Botões `+`/`-` na tela de Estoque (delta de 1 unidade).
- Campo "Quantidade em estoque" no modal de configuração do produto (define valor exato).
- Campo "Estoque atual" no formulário de criação de produto (`admin/src/pages/Products.tsx`).

Toda mudança de estoque (por qualquer um dos 3 caminhos) dispara `checkAndNotifyLowStock()` automaticamente — ver `docs/features/notificacoes-de-estoque.md`.

## Aviso no Dashboard

Se algum produto estiver com `isLowStock: true`, aparece um card de aviso no topo do Dashboard (`admin/src/pages/Dashboard.tsx`), com link direto pra tela de Estoque.
