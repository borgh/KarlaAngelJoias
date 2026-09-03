# Catálogo e produtos (site público)

## Onde fica o código

- `src/context/SiteDataContext.tsx` — busca produtos/categorias/conteúdo/carrossel da API uma vez, com fallback pros dados estáticos de `src/data/products.ts` e `src/data/site.ts` se a API estiver fora do ar.
- `src/components/ProductCard.tsx` — card reutilizável (usado tanto em "Mais vendidos" quanto em "Catálogo completo").
- `src/components/ProductModal.tsx` — modal de detalhes, abre ao clicar em qualquer card.
- `src/components/BestSellers.tsx` — seção "Mais vendidos".
- `src/components/Catalog.tsx` — seção "Catálogo completo", com filtro por categoria.

## Duas seções, dois propósitos

- **Mais vendidos** (`#mais-vendidos`): só produtos com `isBestseller: true`. Se **nenhum** produto estiver marcado (catálogo novo, por exemplo), cai automaticamente pro catálogo geral em vez de mostrar uma seção vazia (ver `products.filter((p) => p.isBestseller)`, com fallback em `BestSellers.tsx`).
- **Catálogo completo** (`#catalogo`): **todos** os produtos ativos, com abas de filtro por categoria geradas dinamicamente (só aparecem categorias que realmente têm produto).

Isso existe porque, originalmente, produtos sem a marcação "mais vendido" não apareciam em lugar nenhum do site — bug real relatado e corrigido (ver `CHANGELOG.md`, e-mail commit "adiciona seção Catálogo Completo").

## Modal de detalhes

Clicar em qualquer card (não só o botão de comprar) abre um modal com imagem grande, categoria, preço, descrição completa e botão de WhatsApp. O clique no botão "Comprar no WhatsApp" dentro do card usa `stopPropagation()` pra não abrir o modal por engano.

Acessibilidade: o card não é um `<button>` de verdade (teria um link `<a>` de WhatsApp aninhado dentro, inválido em HTML) — é uma `<div role="button" tabIndex={0}>` com `onKeyDown` tratando Enter/Espaço.

## Galeria de até 5 fotos por produto

Cada produto pode ter até 5 imagens (`images: string[]`, campo do produto). A primeira da lista é a "capa" — usada no card do catálogo e mantida também em `imageUrl` (compatibilidade, sempre igual a `images[0]`).

**Admin** (`admin/src/components/ImageGalleryUpload.tsx`): upload múltiplo (várias fotos de uma vez), reordenar com setinhas (a ordem define qual é a capa), remover individualmente. Limite de 5 aplicado tanto no front quanto no backend (`sanitizeImages()` em `server/src/routes/products.js`, corta qualquer excesso enviado).

**Site público** (`src/components/ProductImageCarousel.tsx`): carrossel com setas, indicadores (dots clicáveis) e arrastar (swipe, via `framer-motion`) — usado no `ProductModal`. Só mostra os controles de navegação quando o produto tem mais de 1 foto; com 1 foto ou nenhuma, comportamento idêntico a antes (sem elementos de navegação à toa). `ProductCard` mostra só a capa + um selo discreto com o número de fotos quando há mais de uma.

**Migração**: produtos criados antes dessa funcionalidade tinham só `imageUrl` (string única) — migração automática em `seed.js` converte pra `images: [imageUrl]` no boot do servidor, sem perder nenhuma foto já cadastrada.

## Sem descrição cadastrada

Se o produto não tem `description` preenchida no admin, o modal mostra um texto padrão convidando a falar no WhatsApp — nunca fica em branco.

## Estoque em tempo real (sincronizado com o admin)

Cada card e o modal mostram um rótulo de estoque, calculado por `src/lib/stockLabel.ts` (reusado nos dois lugares, pra não divergir):
- **"Em estoque"** — estoque normal, sem urgência.
- **"Últimas N unidades"** (vermelho) — quando o produto está no limite mínimo configurado no admin (mesma hierarquia produto → categoria → geral de `docs/features/gestao-de-estoque.md`).
- **"Esgotado"** — `stockQuantity <= 0`. Foto em escala de cinza, botão de compra vira um botão desativado ("Produto esgotado").

A rota pública `GET /api/products` (`server/src/routes/products.js`, `serializePublic`) calcula `isLowStock` com a mesma função `resolveStockRules()` usada no admin — nunca duplica a regra. Resposta saneada: não expõe `lowStockNotifiedAt`, `minStockThreshold` nem `notifyChannels` (campos internos de gestão, sem uso no site).

**Sincronização**: o site busca produtos da API a cada carregamento de página (sem cache próprio) — qualquer ajuste de estoque feito no admin aparece na próxima vez que alguém abrir ou recarregar o site. Não há atualização "ao vivo" numa aba já aberta (sem WebSocket/polling); se isso vier a ser necessário no futuro, é um ponto de extensão natural.
