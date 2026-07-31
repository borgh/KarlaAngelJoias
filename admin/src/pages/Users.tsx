import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { User } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const EMPTY = {
  name: '',
  email: '',
  password: '',
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canManageUsers: false,
}

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await api.get<{ users: User[] }>('/api/users')
    setUsers(data.users)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      canCreate: u.canCreate,
      canEdit: u.canEdit,
      canDelete: u.canDelete,
      canManageUsers: u.canManageUsers,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setError('')
    try {
      if (editing) {
        const payload: Record<string, unknown> = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/api/users/${editing.id}`, payload)
      } else {
        await api.post('/api/users', form)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este usuário? Ele perderá acesso ao painel imediatamente.')) return
    try {
      await api.del(`/api/users/${id}`)
      await load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao excluir.')
    }
  }

  const permissionLabels: { key: 'canCreate' | 'canEdit' | 'canDelete' | 'canManageUsers'; label: string }[] = [
    { key: 'canCreate', label: 'Criar' },
    { key: 'canEdit', label: 'Editar' },
    { key: 'canDelete', label: 'Excluir' },
    { key: 'canManageUsers', label: 'Gerenciar usuários' },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Usuários do painel</h1>
          <p className="mt-1 text-sm text-ink/55">Controle quem pode acessar e o que cada um pode fazer.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ivory hover:bg-ink-soft"
        >
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {loading ? (
        <p className="text-ink/50">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-dim text-[12px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Permissões</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-ink/5">
                  <td className="px-5 py-3 font-medium text-ink">
                    {u.name} {u.id === me?.id && <span className="text-[11px] text-ink/40">(você)</span>}
                  </td>
                  <td className="px-5 py-3 text-ink/70">{u.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {permissionLabels
                        .filter((p) => u[p.key])
                        .map((p) => (
                          <span key={p.key} className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-ink/70">
                            {p.label}
                          </span>
                        ))}
                      {!u.isActive && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px] text-ink/50">Inativo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="rounded-lg px-3 py-1.5 text-[12px] text-ink/60 hover:bg-ivory-dim">
                        Editar
                      </button>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg p-2 text-garnet/70 hover:bg-garnet/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">{editing ? 'Editar usuário' : 'Novo usuário'}</h2>
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
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  {editing ? 'Nova senha (deixe em branco para manter)' : 'Senha (mín. 8 caracteres)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                  Permissões
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {permissionLabels.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm text-ink/75">
                      <input
                        type="checkbox"
                        checked={form[p.key] as boolean}
                        onChange={(e) => setForm({ ...form, [p.key]: e.target.checked })}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="rounded-lg bg-garnet/10 px-3 py-2 text-[13px] text-garnet">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink/60 hover:bg-ivory-dim">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.email || (!editing && form.password.length < 8)}
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
