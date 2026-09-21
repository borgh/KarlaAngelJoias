import { useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import type { CartItem } from '../../context/CartContext'
import type { CustomerInfo, AddressInfo, PaymentInfo, OrderResult } from './types'
import { estimateShippingCents } from './types'
import { apiPost, ApiError } from '../../lib/api'

const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ReviewStep({
  items,
  customer,
  address,
  paymentInfo,
  onBack,
  onOrderCreated,
}: {
  items: CartItem[]
  customer: CustomerInfo
  address: AddressInfo
  paymentInfo: PaymentInfo
  onBack: () => void
  onOrderCreated: (order: OrderResult) => void
}) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const subtotalCents = items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.quantity, 0)
  const shippingCents = estimateShippingCents(subtotalCents, paymentInfo.shipping)
  const totalCents = subtotalCents + shippingCents

  async function createOrder() {
    setCreating(true)
    setError('')
    try {
      const data = await apiPost<{ order: OrderResult }>('/api/orders', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer,
        address,
      })
      onOrderCreated(data.order)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o pedido. Tenta de novo?')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-ink/50 hover:text-ink">
        <ChevronLeft size={15} /> Voltar
      </button>

      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-deep">Itens</p>
        <ul className="divide-y divide-taupe/40 rounded-sm border border-taupe/60 bg-white/60">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-ivory-dim">
                {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-display text-[14px] leading-tight text-ink">{item.name}</p>
                <p className="text-[12px] text-ink/50">
                  {item.quantity}x {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <p className="text-[14px] font-medium text-ink">{formatBRL(Math.round(item.price * 100) * item.quantity)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-deep">Entregar para</p>
        <p className="text-[14px] text-ink/75">
          {customer.name} · {customer.phone}
          <br />
          {address.street}, {address.number}
          {address.complement && ` — ${address.complement}`}
          <br />
          {address.neighborhood && `${address.neighborhood} — `}
          {address.city}/{address.state} · CEP {address.cep}
        </p>
      </div>

      <div className="space-y-1.5 border-t border-taupe/60 pt-4 text-[14px]">
        <div className="flex justify-between text-ink/65">
          <span>Subtotal</span>
          <span>{formatBRL(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-ink/65">
          <span>Frete</span>
          <span>{shippingCents === 0 ? 'Grátis' : formatBRL(shippingCents)}</span>
        </div>
        <div className="flex justify-between pt-1.5 text-[17px] font-semibold text-ink">
          <span>Total</span>
          <span className="text-gold-deep">{formatBRL(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-[13px] text-garnet">{error}</p>}

      <button
        onClick={createOrder}
        disabled={creating}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-rose disabled:opacity-60"
      >
        {creating && <Loader2 size={15} className="animate-spin" />}
        {creating ? 'Confirmando…' : 'Continuar para pagamento'}
      </button>
    </div>
  )
}
