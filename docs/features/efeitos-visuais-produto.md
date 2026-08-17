# Efeitos visuais nas fotos de produto

Dois efeitos sobrepostos em toda foto de produto (real ou placeholder), simulando reflexo de luz numa joia — pedido explícito pra dar um toque "de luxo" ao catálogo.

## Onde fica o código

- `src/components/Sparkles.tsx` — os dois efeitos (`Shimmer` e `Sparkles`).
- `src/index.css` — os `@keyframes` (`shimmer`, `twinkle`).
- Usado em `src/components/ProductCard.tsx` e `src/components/ProductModal.tsx`.

## Brilho diagonal (`Shimmer`)

Uma faixa clara varrendo a imagem na diagonal, em loop — mas **não continuamente**: o `@keyframes shimmer` passa a maior parte do ciclo "em repouso" (fora da área visível) e só uma fração do tempo em movimento:

```css
@keyframes shimmer {
  0%, 55% { background-position: -200% 0; }   /* repouso — 55% do ciclo */
  85%     { background-position: 200% 0; }     /* varredura — 30% do ciclo */
  100%    { background-position: 200% 0; }      /* pausa final — 15% do ciclo */
}
```

Duração total e atraso inicial são **pseudo-aleatórios, mas estáveis por produto** (mesma função de hash determinística usada nas estrelas, seed = `product.id`) — assim os cards nunca brilham todos ao mesmo tempo, e o mesmo produto sempre tem o mesmo ritmo (não muda a cada re-render).

⚠️ **`background-repeat: no-repeat` é obrigatório** — sem isso, o gradiente tila e uma cópia da faixa fica sempre visível em algum ponto da imagem, mesmo fora do momento do flash (bug real, já corrigido — ver `troubleshooting.md`).

## Mini estrelas cintilantes (`Sparkles`)

De 4 a 7 pequenas estrelas (SVG de 4 pontas), em posições pseudo-aleatórias (também seed = `product.id`, então cada produto tem seu próprio padrão fixo), cada uma com tamanho/duração/atraso levemente diferentes (`@keyframes twinkle`, opacidade + escala pulsando).

## Função de aleatoriedade determinística

```js
function seededRandom(seed: string, index: number) {
  let h = 0
  const str = `${seed}-${index}`
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h % 1000) / 1000
}
```

Gera um número entre 0 e 1 determinístico a partir de uma string + índice — usado tanto pras posições das estrelas quanto pro timing do brilho, exportado de `Sparkles.tsx` pra reuso.
