export type Glyph = 'ring' | 'necklace' | 'earring' | 'bracelet'

export type ProductView = {
  id: string
  name: string
  categoryName: string
  price: number
  badge?: string
  glyph: Glyph
  imageUrl?: string
}

export type CategoryView = {
  id: string
  name: string
  description: string
  glyph: Glyph
}

export type InstagramItemView = {
  id: string
  imageUrl?: string
  title?: string
  linkUrl?: string
}
