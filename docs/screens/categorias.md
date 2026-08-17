# Tela — Categorias (`/categorias`)

`admin/src/pages/Categories.tsx`. Cards em grid + modal de formulário.

Campos: nome, descrição, ícone (select traduzido pra português: Anel/Colar/Brinco/Pulseira-Riviera, mas o valor salvo continua em inglês — `ring`/`necklace`/`earring`/`bracelet`, usado pelo componente `JewelGlyph` no site), e a seção de estoque (limite mínimo padrão da categoria + canais de alerta padrão, com a mesma UI de "usar padrão geral" da tela de Estoque).

Excluir uma categoria não exclui os produtos dela — eles ficam com `categoryId: null` (aparecem como "Sem categoria").
