# API — Categorias

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/categories` | — | Lista pública, ordenada por `sortOrder` |
| POST | `/api/categories/admin` | `canCreate` | Cria categoria |
| PUT | `/api/categories/admin/:id` | `canEdit` | Edita categoria |
| DELETE | `/api/categories/admin/:id` | `canDelete` | Exclui categoria — produtos dela ficam com `categoryId: null` (não são excluídos) |

## Campos

```
id, name, description, glyph,   // glyph: 'ring' | 'necklace' | 'earring' | 'bracelet' (ícone de linha no site)
sortOrder,
minStockThreshold,              // padrão de estoque pra produtos desta categoria sem valor próprio, ou null
notifyChannels                  // canais de alerta padrão pra essa categoria, ou null (usa o geral)
```

Ver `docs/features/gestao-de-estoque.md` para como `minStockThreshold`/`notifyChannels` daqui se encaixam na hierarquia produto → categoria → geral.
