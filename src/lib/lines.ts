// "Linhas" da marca — eixo principal do menu (Semijoia · Joias ·
// Moissanite · Noiva). É uma dimensão independente de categoria
// (anel/colar/brinco…): um anel pode ser semijoia ou joia.
export type ProductLine = 'semijoia' | 'joias' | 'moissanite' | 'noiva'

export const LINES: { id: ProductLine; label: string; tagline: string }[] = [
  { id: 'semijoia', label: 'Semijoia', tagline: 'Banho de ouro 18k, para todo dia' },
  { id: 'joias', label: 'Joias', tagline: 'Ouro 18k e prata 925' },
  { id: 'moissanite', label: 'Moissanite', tagline: 'O brilho do diamante' },
  { id: 'noiva', label: 'Noiva', tagline: 'Para o dia mais especial' },
]

export const CATALOG_HASH_PREFIX = '#catalogo'

// Link do menu que abre o catálogo já filtrado por linha (#catalogo/joias).
export function lineHref(line: ProductLine) {
  return `${CATALOG_HASH_PREFIX}/${line}`
}

// Lê a linha a partir do hash da URL (usado pelo Catálogo). "#catalogo" → null.
export function lineFromHash(hash: string): ProductLine | null {
  if (!hash.startsWith(CATALOG_HASH_PREFIX + '/')) return null
  const id = hash.slice(CATALOG_HASH_PREFIX.length + 1)
  return LINES.some((l) => l.id === id) ? (id as ProductLine) : null
}
