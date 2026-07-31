import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Category } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const GLYPHS = ['ring', 'necklace', 'earring', 'bracelet']
const EMPTY = { name: '', description: '', glyph: 'ring', sortOrder: 0 }

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const data = await api.get<{ categories: Category[] }>('/api/categories')
    setCategories(data.categories)
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, description: c.description, glyph: c.glyph, sortOrder: c.sortOrder })
    setShowForm(true)
  }

  async function handleSave() {
    setError('')
    try {
      if (editing) {
        await api.put(`/api/categories/admin/${editing.id}`, form)
      } else {
        await api.post('/api/categories/admin', form)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria? Os produtos dela ficarão sem categoria.')) return
    await api.del(`/api/categories/admin/${id}`)
    await load()
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Categorias</h1>
        {user?.canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ivory hover:bg-ink-soft"
          >
            <Plus size={16} /> Nova categoria
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-5">
            <div>
              <p className="font-display text-lg text-ink">{c.name}</p>
              <p className="text-[13px] text-ink/55">{c.description}</p>
            </div>
            <div className="flex gap-2">
              {user?.canEdit && (
                <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-ink/60 hover:bg-ivory-dim">
                  <Pencil size={15} />
                </button>
              )}
              {user?.canDelete && (
                <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-garnet/70 hover:bg-garnet/10">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink/50 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Descrição</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Ícone</label>
                <select
                  value={form.glyph}
                  onChange={(e) => setForm({ ...form, glyph: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                >
                  {GLYPHS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="rounded-lg bg-garnet/10 px-3 py-2 text-[13px] text-garnet">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink/60 hover:bg-ivory-dim">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name}
                  className="rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
