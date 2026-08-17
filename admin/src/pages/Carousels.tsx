import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { api } from '../lib/api'
import type { CarouselItem } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ImageUpload } from '../components/ImageUpload'

const CAROUSEL_NAME = 'instagram'

export default function Carousels() {
  const { user } = useAuth()
  const [items, setItems] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    try {
      const data = await api.get<{ items: CarouselItem[] }>(`/api/carousels/${CAROUSEL_NAME}/admin`)
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addItem() {
    await api.post(`/api/carousels/${CAROUSEL_NAME}/admin`, { sortOrder: items.length })
    await load()
  }

  async function saveItem(item: CarouselItem) {
    setSavingId(item.id)
    await api.put(`/api/carousels/items/${item.id}/admin`, item)
    setSavingId(null)
    await load()
  }

  async function removeItem(id: string) {
    if (!confirm('Remover este item do carrossel?')) return
    await api.del(`/api/carousels/items/${id}/admin`)
    await load()
  }

  function updateLocal(id: string, patch: Partial<CarouselItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  if (loading) return <p className="text-ink/50">Carregando…</p>

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Carrossel do Instagram</h1>
          <p className="mt-1 text-sm text-ink/55">
            Imagens exibidas na seção "Acompanhe no Instagram" do site.
          </p>
        </div>
        {user?.canCreate && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ivory hover:bg-ink-soft"
          >
            <Plus size={16} /> Novo item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-ink/10 bg-white p-5">
            <ImageUpload value={item.imageUrl} onChange={(url) => updateLocal(item.id, { imageUrl: url })} />
            <input
              placeholder="Legenda (opcional)"
              value={item.title}
              onChange={(e) => updateLocal(item.id, { title: e.target.value })}
              className="mt-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <input
              placeholder="Link (opcional)"
              value={item.linkUrl}
              onChange={(e) => updateLocal(item.id, { linkUrl: e.target.value })}
              className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <label className="mt-2 flex items-center gap-2 text-[13px] text-ink/70">
              <input
                type="checkbox"
                checked={item.isActive}
                onChange={(e) => updateLocal(item.id, { isActive: e.target.checked })}
              />
              Visível no site
            </label>
            <div className="mt-3 flex justify-between">
              {user?.canDelete && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex items-center gap-1 text-[12px] text-garnet/80 hover:text-garnet"
                >
                  <Trash2 size={13} /> Remover
                </button>
              )}
              {user?.canEdit && (
                <button
                  onClick={() => saveItem(item)}
                  disabled={savingId === item.id}
                  className="ml-auto flex items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright"
                >
                  <Save size={13} /> {savingId === item.id ? 'Salvando…' : 'Salvar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
