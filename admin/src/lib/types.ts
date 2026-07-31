export type User = {
  id: string
  name: string
  email: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageUsers: boolean
  isActive: boolean
  createdAt: string
}

export type Category = {
  id: string
  name: string
  description: string
  glyph: string
  sortOrder: number
}

export type Product = {
  id: string
  name: string
  categoryId: string | null
  price: number
  badge: string
  description: string
  imageUrl: string
  isBestseller: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type CarouselItem = {
  id: string
  carousel: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
  isActive: boolean
}
