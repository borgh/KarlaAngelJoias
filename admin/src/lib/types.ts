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

export type ProductLine = 'semijoia' | 'joias' | 'moissanite' | 'noiva'
export const PRODUCT_LINES: { value: ProductLine; label: string }[] = [
  { value: 'semijoia', label: 'Semijoia' },
  { value: 'joias', label: 'Joias' },
  { value: 'moissanite', label: 'Moissanite' },
  { value: 'noiva', label: 'Noiva' },
]

export type Product = {
  id: string
  name: string
  categoryId: string | null
  price: number
  badge: string
  description: string
  line: ProductLine | null
  imageUrl: string
  images: string[]
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
  whatsappNotifyNumber: string
  whatsappServerConfigured: boolean
  pushVapidPublicKey: string
  mercadopago: {
    mode: 'sandbox' | 'production'
    sandboxPublicKey: string
    sandboxAccessTokenSet: boolean
    productionPublicKey: string
    productionAccessTokenSet: boolean
    webhookSecretSet: boolean
    configured: boolean
  }
  shipping: {
    flatRateCents: number
    freeAboveCents: number
  }
}

export type WhatsAppStatus = {
  configured: boolean
  state: 'open' | 'connecting' | 'close' | 'unconfigured'
}

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'rejected'

export type OrderItem = {
  productId: string
  name: string
  image: string
  priceCents: number
  quantity: number
}

export type Order = {
  id: string
  number: string
  status: OrderStatus
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  customer: { name: string; email: string; phone: string; document: string }
  address: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
  mpPaymentId: string | null
  paymentMethod: string | null
  paymentStatusDetail: string | null
  trackingCode: string | null
  notes: string
  createdAt: string
  updatedAt: string
  paidAt: string | null
  shippedAt: string | null
}
