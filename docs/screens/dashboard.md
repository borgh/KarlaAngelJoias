# Tela — Visão geral / Dashboard (`/`)

`admin/src/pages/Dashboard.tsx`. Cards de resumo (produtos, categorias, mais vendidos, fotos no carrossel) + 4 gráficos com Recharts:

- **Barras**: produtos por categoria.
- **Pizza**: produtos ativos vs. ocultos no site.
- **Pizza**: mais vendidos vs. catálogo geral.
- **Área**: total de produtos cadastrados ao longo do tempo (acumulado por `createdAt`) + preço médio.

Se algum produto estiver com `isLowStock: true`, aparece um card de aviso (fundo granada) logo abaixo dos gráficos, com link pra `/estoque`.

Contagem de usuários só aparece pra quem tem `canManageUsers` (chamada a `/api/users` é condicional a essa permissão).
