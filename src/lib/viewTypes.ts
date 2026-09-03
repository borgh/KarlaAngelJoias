export type Glyph = 'ring' | 'necklace' | 'earring' | 'bracelet'

export type ProductView = {
  id: string
  name: string
  categoryName: string
  price: number
  badge?: string
  glyph: Glyph
  imageUrl?: string
  images: string[]
  description?: string
  isBestseller: boolean
  stockQuantity: number
  isLowStock: boolean
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
