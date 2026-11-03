import type { ProductView } from './viewTypes'

export const RELATED_COUNT = 4

// Sugestões "Você também vai gostar": se a Karla escolheu produtos
// relacionados no admin, usa exatamente esses; senão pontua os demais
// por semelhança (tipo de peça, linha, faixa de preço).
export function getRelatedProducts(product: ProductView, all: ProductView[]): ProductView[] {
  const byId = new Map(all.map((p) => [p.id, p]))
  const manual = product.relatedIds.map((id) => byId.get(id)).filter((p): p is ProductView => !!p && p.id !== product.id)
  if (manual.length > 0) return manual

  return all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0
      if (p.categoryName === product.categoryName) score += 4
      if (p.line && p.line === product.line) score += 3
      const ratio = Math.min(p.price, product.price) / (Math.max(p.price, product.price) || 1)
      score += ratio * 2
      if (p.stockQuantity <= 0) score -= 5
      if (p.isBestseller) score += 0.3
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_COUNT)
    .map((x) => x.p)
}
