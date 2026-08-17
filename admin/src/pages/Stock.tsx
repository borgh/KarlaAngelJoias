import { useEffect, useState } from 'react'
import { AlertTriangle, Minus, Plus, Save, Search, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Product, Category, NotifyChannel } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const CHANNEL_LABELS: { value: NotifyChannel; label: string }[] = [
  { value: 'push', label: 'Push (navegador)' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export default function Stock() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const [p, c] = await Promise.all([
      api.get<{ products: Product[] }>('/api/products/admin'),
      api.get<{ categories: Category[] }>('/api/categories'),
    ])
    setProducts(p.products)
    setCategories(c.categories)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function adjust(id: string, delta: number) {
    setBusyId(id)
    try {
      await api.patch<{ product: Product }>(`/api/products/admin/${id}/stock`, { delta })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || '—'

  const filtered = products.filter((p) => {
    if (onlyLow && !p.isLowStock) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const lowCount = products.filter((p) => p.isLowStock).length

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Estoque</h1>
          <p className="mt-1 text-sm text-ink/55">
            {products.length} produtos ·{' '}
            {lowCount > 0 ? (
              <span className="font-semibold text-garnet">{lowCount} com estoque baixo</span>
            ) : (
              'nenhum com estoque baixo'
            )}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full rounded-full border border-ink/15 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gold"
          />
        </div>
        <label className="flex items-center gap-2 whitespace-nowrap text-[13px] text-ink/70">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Só estoque baixo
        </label>
      </div>

      {loading ? (
        <p className="text-ink/50">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-ivory-dim text-[12px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Limite mín.</th>
                <th className="px-5 py-3">Estoque</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`border-t border-ink/5 ${p.isLowStock ? 'bg-garnet/5' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {p.isLowStock && <AlertTriangle size={14} className="shrink-0 text-garnet" />}
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{categoryName(p.categoryId)}</td>
                  <td className="px-5 py-3 text-ink/60">
                    {p.effectiveMinStockThreshold}
                    {p.minStockThreshold === null && (
                      <span className="ml-1 text-[11px] text-ink/35">(padrão)</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {user?.canEdit && (
                        <button
                          onClick={() => adjust(p.id, -1)}
                          disabled={busyId === p.id || p.stockQuantity <= 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-gold hover:text-gold disabled:opacity-30"
                        >
                          <Minus size={13} />
                        </button>
                      )}
                      <span
                        className={`w-8 text-center font-semibold ${p.isLowStock ? 'text-garnet' : 'text-ink'}`}
                      >
                        {p.stockQuantity}
                      </span>
                      {user?.canEdit && (
                        <button
                          onClick={() => adjust(p.id, 1)}
                          disabled={busyId === p.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-gold hover:text-gold disabled:opacity-30"
                        >
                          <Plus size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {user?.canEdit && (
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-lg px-3 py-1.5 text-[12px] text-ink/60 hover:bg-ivory-dim"
                      >
                        Configurar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <StockConfigModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
        />
      )}
    </div>
  )
}

function StockConfigModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [quantity, setQuantity] = useState(product.stockQuantity)
  const [threshold, setThreshold] = useState<string>(
    product.minStockThreshold === null ? '' : String(product.minStockThreshold)
  )
  const [channels, setChannels] = useState<NotifyChannel[]>(product.notifyChannels || [])
  const [useDefaultChannels, setUseDefaultChannels] = useState(product.notifyChannels === null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleChannel(c: NotifyChannel) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/products/admin/${product.id}`, {
        stockQuantity: quantity,
        minStockThreshold: threshold === '' ? null : Number(threshold),
        notifyChannels: useDefaultChannels ? null : channels,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{product.name}</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
              Quantidade em estoque
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
              Limite mínimo (deixe em branco pra usar o padrão da categoria/geral)
            </label>
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={`Padrão atual: ${product.effectiveMinStockThreshold}`}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[13px] text-ink/70">
              <input
                type="checkbox"
                checked={useDefaultChannels}
                onChange={(e) => setUseDefaultChannels(e.target.checked)}
              />
              Usar canais de alerta padrão (categoria/geral)
            </label>
            {!useDefaultChannels && (
              <div className="space-y-2 rounded-lg border border-ink/10 p-3">
                {CHANNEL_LABELS.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm text-ink/75">
                    <input
                      type="checkbox"
                      checked={channels.includes(c.value)}
                      onChange={() => toggleChannel(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-garnet/10 px-3 py-2 text-[13px] text-garnet">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink/60 hover:bg-ivory-dim">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
