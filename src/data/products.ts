export type Product = {
  id: string
  name: string
  category: 'Brincos' | 'Colares' | 'Anéis' | 'Rivieras' | 'Moissanite'
  price: number
  badge?: string
  glyph: 'ring' | 'earring' | 'necklace' | 'bracelet'
}

// Nomes de coleção alinhados ao que aparece hoje no Instagram
// @karlaangeljoias (Aro Jade, linha Lizzie, rivieras, moissanite).
// Preços são estimativas de mercado para o segmento — ajustar para os
// valores reais praticados pela Karla Angel antes da publicação.
export const products: Product[] = [
  { id: 'p1', name: 'Anel Lizzie Cravejado', category: 'Anéis', price: 289.9, badge: 'Mais vendido', glyph: 'ring' },
  { id: 'p2', name: 'Colar Aro Jade', category: 'Colares', price: 349.9, badge: 'Novo', glyph: 'necklace' },
  { id: 'p3', name: 'Brinco Lizzie', category: 'Brincos', price: 219.9, glyph: 'earring' },
  { id: 'p4', name: 'Riviera Cravejada Dupla', category: 'Rivieras', price: 429.9, badge: 'Mais vendido', glyph: 'bracelet' },
  { id: 'p5', name: 'Anel Solitário Moissanite', category: 'Moissanite', price: 599.9, badge: 'Luxo', glyph: 'ring' },
  { id: 'p6', name: 'Colar Gota Esmeralda', category: 'Colares', price: 379.9, badge: 'Novo', glyph: 'necklace' },
  { id: 'p7', name: 'Ear Cuff Constelação', category: 'Brincos', price: 259.9, glyph: 'earring' },
  { id: 'p8', name: 'Riviera Moissanite Tênis', category: 'Moissanite', price: 749.9, badge: 'Luxo', glyph: 'bracelet' },
]

export const categories: { name: string; description: string; glyph: Product['glyph'] }[] = [
  { name: 'Anéis', description: 'Do minimalista ao cravejado', glyph: 'ring' },
  { name: 'Colares', description: 'Camadas para compor o seu look', glyph: 'necklace' },
  { name: 'Brincos', description: 'Argolas, ear cuffs e clássicos', glyph: 'earring' },
  { name: 'Rivieras', description: 'Cravejadas, para empilhar', glyph: 'bracelet' },
  { name: 'Moissanite', description: 'O brilho do diamante, em ouro 18k', glyph: 'ring' },
]
