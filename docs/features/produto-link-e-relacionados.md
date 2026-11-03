# Link direto do produto e produtos relacionados

## Link direto
- Botão com ícone de corrente no canto do modal do produto copia `https://<site>/?produto=<id>`.
- Ao abrir esse link, o modal do produto abre automaticamente. Abrir/fechar atualiza a URL (histórico do navegador; "voltar" fecha o modal).
- Implementação: `src/context/ProductViewerContext.tsx` (modal único), cards usam `useProductViewer().open`.

## Você também vai gostar
- Admin → Produtos → "Produtos relacionados": marque até 8 peças (campo `relatedIds`, validado em `server/src/routes/products.js`).
- Sem seleção manual, `src/lib/related.ts` ranqueia por mesma categoria (+4), mesma linha (+3), proximidade de preço (até +2); esgotados vão pro fim. Mostra 4.
- Título editável em Textos do site → Produtos (`product.related_title`).

## Nomes do menu
Chaves `nav.*` em Textos do site → "Menu (nomes dos itens)" (defaults em `server/src/db/contentDefaults.js` e `src/data/site.ts`).
