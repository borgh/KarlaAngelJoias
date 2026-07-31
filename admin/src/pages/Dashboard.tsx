import { useEffect, useState } from 'react'
import { Gem, Tags, Users as UsersIcon, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Product, Category, User } from '../lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({ products: 0, categories: 0, users: 0 })

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([
        api.get<{ products: Product[] }>('/api/products/admin'),
        api.get<{ categories: Category[] }>('/api/categories'),
      ])
      let usersCount = 0
      if (user?.canManageUsers) {
        const u = await api.get<{ users: User[] }>('/api/users')
        usersCount = u.users.length
      }
      setCounts({ products: p.products.length, categories: c.categories.length, users: usersCount })
    }
    load()
  }, [user])

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Olá, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-sm text-ink/55">Aqui está um resumo do site da Karla Angel.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <Gem className="text-gold" size={22} strokeWidth={1.5} />
          <p className="mt-3 font-display text-3xl text-ink">{counts.products}</p>
          <p className="text-[13px] text-ink/55">Produtos cadastrados</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <Tags className="text-gold" size={22} strokeWidth={1.5} />
          <p className="mt-3 font-display text-3xl text-ink">{counts.categories}</p>
          <p className="text-[13px] text-ink/55">Categorias</p>
        </div>
        {user?.canManageUsers && (
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <UsersIcon className="text-gold" size={22} strokeWidth={1.5} />
            <p className="mt-3 font-display text-3xl text-ink">{counts.users}</p>
            <p className="text-[13px] text-ink/55">Usuários do painel</p>
          </div>
        )}
      </div>

      <a
        href="https://karlaangeljoias.com.br"
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-ink/70 hover:text-gold"
      >
        Ver site público <ExternalLink size={14} />
      </a>
    </div>
  )
}
