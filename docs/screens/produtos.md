# Tela — Produtos (`/produtos`)

`admin/src/pages/Products.tsx`. Tabela (nome/foto, categoria, preço, estoque, status, ações) + modal de formulário pra criar/editar.

Colunas com scroll horizontal em telas pequenas (`overflow-x-auto` + `min-w-[640px]` na tabela).

Campos do formulário: imagem (upload via `ImageUpload.tsx`), nome, categoria, preço, **estoque atual** (quantidade inicial — limite mínimo e canais de alerta ficam na tela de Estoque, não aqui), selo (texto livre tipo "Novo"/"Luxo"), descrição, "mostrar em Mais vendidos", "ativo no site".

Excluir pede confirmação nativa do navegador (`confirm()`) antes de chamar a API.
