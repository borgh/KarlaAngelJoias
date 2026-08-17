# Tela — Estoque (`/estoque`)

`admin/src/pages/Stock.tsx`. Ver `docs/features/gestao-de-estoque.md` para a lógica de negócio completa.

- Busca por nome + checkbox "Só estoque baixo".
- Botões `+`/`-` inline pra ajuste rápido (chamam `PATCH /api/products/admin/:id/stock` com `delta`).
- Botão "Configurar" abre um modal por produto: quantidade exata, limite mínimo próprio (ou herdar), canais de alerta próprios (ou herdar — checkbox "usar canais padrão" some/mostra os checkboxes individuais).
- Linhas com estoque baixo ganham fundo levemente granada e ícone de alerta ao lado do nome.
