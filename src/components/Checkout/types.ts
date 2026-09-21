export type CustomerInfo = {
  name: string
  email: string
  phone: string
  document: string
}

export type AddressInfo = {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export type OrderResult = {
  id: string
  number: string
  status: string
  items: { name: string; image: string; quantity: number; priceCents: number }[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  customerName: string
  createdAt: string
  paymentStatusDetail: string | null
}

export type PaymentInfo = {
  configured: boolean
  publicKey: string
  mode: 'sandbox' | 'production'
  shipping: { flatRateCents: number; freeAboveCents: number }
}

export const EMPTY_CUSTOMER: CustomerInfo = { name: '', email: '', phone: '', document: '' }
export const EMPTY_ADDRESS: AddressInfo = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

export function estimateShippingCents(subtotalCents: number, shipping: PaymentInfo['shipping']) {
  if (shipping.freeAboveCents > 0 && subtotalCents >= shipping.freeAboveCents) return 0
  return shipping.flatRateCents
}
