import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Product, Category } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ImageUpload } from '../components/ImageUpload'

type ProductFormFields = Pick<
  Product,
  'name' | 'categoryId' | 'price' | 'badge' | 'description' | 'imageUrl' | 'isBestseller' | 'isActive' | 'sortOrder' | 'stockQuantity'
>

const EMPTY_FORM: ProductFormFields = {
  name: '',
  categoryId: null,
  price: 0,
  badge: '',
  description: '',
  imageUrl: '',
  isBestseller: false,
  isActive: true,
  sortOrder: 0,
  stockQuantity: 0,
}

export default function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
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

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      price: p.price,
      badge: p.badge,
      description: p.description,
      imageUrl: p.imageUrl,
      isBestseller: p.isBestseller,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      stockQuantity: p.stockQuantity,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/api/products/admin/${editing.id}`, form)
      } else {
        await api.post('/api/products/admin', form)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este produto? Essa ação não pode ser desfeita.')) return
    await api.del(`/api/products/admin/${id}`)
    await load()
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || '—'

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Produtos</h1>
          <p className="mt-1 text-sm text-ink/55">{products.length} produtos cadastrados</p>
        </div>
        {user?.canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ivory hover:bg-ink-soft"
          >
            <Plus size={16} /> Novo produto
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-ink/50">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ivory-dim text-[12px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Preço</th>
                <th className="px-5 py-3">Estoque</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-ink/5">
                  <td className="flex items-center gap-3 px-5 py-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} className="h-10 w-10 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-ivory-dim" />
                    )}
                    <div>
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.badge && <p className="text-[11px] text-gold">{p.badge}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{categoryName(p.categoryId)}</td>
                  <td className="px-5 py-3 text-ink/70">
                    {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${p.isLowStock ? 'text-garnet' : 'text-ink/70'}`}>
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
                      }`}
                    >
                      {p.isActive ? 'Ativo' : 'Oculto'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {user?.canEdit && (
                        <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-ink/60 hover:bg-ivory-dim">
                          <Pencil size={15} />
                        </button>
                      )}
                      {user?.canDelete && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-2 text-garnet/70 hover:bg-garnet/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">
                {editing ? 'Editar produto' : 'Novo produto'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-ink/50 hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Imagem
                </label>
                <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                    Categoria
                  </label>
                  <select
                    value={form.categoryId || ''}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Estoque atual
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
                <p className="mt-1 text-[11px] text-ink/40">
                  Limite mínimo e canais de alerta ficam na tela de Estoque.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Selo (opcional)
                </label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="Ex: Novo, Mais vendido, Luxo"
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={form.isBestseller}
                    onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })}
                  />
                  Mostrar em "Mais vendidos"
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Ativo no site
                </label>
              </div>

              {error && <p className="rounded-lg bg-garnet/10 px-3 py-2 text-[13px] text-garnet">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink/60 hover:bg-ivory-dim"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
