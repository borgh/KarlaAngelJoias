import { useEffect, useState } from 'react'
import { Search, X, Package, Truck, CheckCircle2, XCircle, Clock, CreditCard, MapPin, User } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Order, OrderStatus } from '../lib/types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  rejected: 'Pagamento recusado',
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-ink/10 text-ink/50',
  rejected: 'bg-garnet/15 text-garnet',
}

const STATUS_ICON: Record<OrderStatus, typeof Clock> = {
  pending_payment: Clock,
  paid: CreditCard,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  rejected: XCircle,
}

const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)

  async function load() {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const data = await api.get<{ orders: Order[] }>(`/api/orders/admin/list?${params}`)
      setOrders(data.orders)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(load, 250) // debounce da busca
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search])

  const revenue = orders.filter((o) => o.status !== 'pending_payment' && o.status !== 'cancelled' && o.status !== 'rejected').reduce((s, o) => s + o.totalCents, 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Pedidos</h1>
          <p className="mt-1 text-sm text-ink/55">
            {orders.length} pedido{orders.length === 1 ? '' : 's'}
            {statusFilter !== 'all' || search ? ' (filtrado)' : ''} · {formatBRL(revenue)} em vendas confirmadas
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nº, nome, e-mail ou telefone"
            className="w-72 rounded-full border border-ink/15 py-2 pl-9 pr-4 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', ...Object.keys(STATUS_LABEL)] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              statusFilter === s ? 'bg-ink text-ivory' : 'bg-white text-ink/60 hover:bg-ink/5'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABEL[s as OrderStatus]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink/50">Carregando…</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <Package size={28} className="mx-auto mb-3 text-ink/25" />
            <p className="text-sm text-ink/50">Nenhum pedido {statusFilter !== 'all' || search ? 'encontrado' : 'ainda'}.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink/40">
              <tr>
                <th className="px-5 py-3">Pedido</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Itens</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((o) => {
                const Icon = STATUS_ICON[o.status]
                return (
                  <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-ivory-dim/60">
                    <td className="px-5 py-3.5 font-medium text-ink">{o.number}</td>
                    <td className="px-5 py-3.5 text-ink/70">{o.customer.name}</td>
                    <td className="px-5 py-3.5 text-ink/55">{o.items.reduce((s, i) => s + i.quantity, 0)} un.</td>
                    <td className="px-5 py-3.5 font-medium text-gold-deep">{formatBRL(o.totalCents)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[o.status]}`}>
                        <Icon size={12} /> {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-ink/45">{formatDate(o.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated)
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
          }}
        />
      )}
    </div>
  )
}

function OrderDetail({ order, onClose, onUpdated }: { order: Order; onClose: () => void; onUpdated: (o: Order) => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || '')
  const [notes, setNotes] = useState(order.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      const data = await api.patch<{ order: Order }>(`/api/orders/admin/${order.id}`, { status, trackingCode, notes })
      onUpdated(data.order)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink/10 bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-deep">Pedido</p>
            <h2 className="font-display text-xl text-ink">{order.number}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-ink/40 hover:text-ink">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink/45">
              <User size={13} /> Cliente
            </p>
            <p className="text-sm text-ink">{order.customer.name}</p>
            <p className="text-sm text-ink/60">{order.customer.email} · {order.customer.phone}</p>
            {order.customer.document && <p className="text-sm text-ink/60">CPF/CNPJ: {order.customer.document}</p>}
          </section>

          <section>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink/45">
              <MapPin size={13} /> Endereço de entrega
            </p>
            <p className="text-sm text-ink/70">
              {order.address.street}, {order.address.number}
              {order.address.complement && ` — ${order.address.complement}`}
              <br />
              {order.address.neighborhood && `${order.address.neighborhood} — `}
              {order.address.city}/{order.address.state} · CEP {order.address.cep}
            </p>
          </section>

          <section>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink/45">Itens</p>
            <div className="divide-y divide-ink/5 rounded-xl border border-ink/10">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-ink/80">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium text-ink">{formatBRL(item.priceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1 text-right text-[13px] text-ink/60">
              <p>Subtotal: {formatBRL(order.subtotalCents)}</p>
              <p>Frete: {order.shippingCents === 0 ? 'Grátis' : formatBRL(order.shippingCents)}</p>
              <p className="text-base font-semibold text-ink">Total: {formatBRL(order.totalCents)}</p>
            </div>
          </section>

          <section>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink/45">
              <CreditCard size={13} /> Pagamento
            </p>
            <p className="text-sm text-ink/70">
              {order.paymentMethod ? `Método: ${order.paymentMethod}` : 'Ainda não processado'}
              {order.paymentStatusDetail && ` · ${order.paymentStatusDetail}`}
            </p>
            {order.mpPaymentId && <p className="text-[12px] text-ink/40">ID Mercado Pago: {order.mpPaymentId}</p>}
          </section>

          <section className="grid grid-cols-2 gap-4 border-t border-ink/10 pt-5">
            <div>
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Código de rastreio</label>
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex.: BR123456789"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Observações internas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </div>
          </section>

          {error && <p className="text-[13px] text-garnet">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-full bg-rose py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
