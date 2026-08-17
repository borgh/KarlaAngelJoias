export type NotifyChannel = 'push' | 'email' | 'whatsapp'

export type User = {
  id: string
  name: string
  email: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageUsers: boolean
  isActive: boolean
  bottomNavConfig?: string[]
  createdAt: string
}

export type Category = {
  id: string
  name: string
  description: string
  glyph: string
  sortOrder: number
  minStockThreshold: number | null
  notifyChannels: NotifyChannel[] | null
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
  stockQuantity: number
  minStockThreshold: number | null
  notifyChannels: NotifyChannel[] | null
  lowStockNotifiedAt: string | null
  effectiveMinStockThreshold: number
  isLowStock: boolean
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

export type NotificationSettings = {
  globalMinStockThreshold: number
  globalNotifyChannels: NotifyChannel[]
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    passSet: boolean
    fromName: string
    fromEmail: string
    notifyToEmail: string
  }
  whatsapp: {
    apiUrl: string
    apiKeySet: boolean
    instanceName: string
    notifyNumber: string
  }
  pushVapidPublicKey: string
}
