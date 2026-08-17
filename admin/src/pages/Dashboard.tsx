import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gem, Tags, Users as UsersIcon, ExternalLink, Star, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Product, Category, User, CarouselItem } from '../lib/types'

const GOLD = '#c89a4c'
const GOLD_BRIGHT = '#e3c27e'
const GARNET = '#7c2f34'
const INK = '#0e2118'
const INK_SOFT = '#8a9c93'

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [igItems, setIgItems] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, c, ig] = await Promise.all([
          api.get<{ products: Product[] }>('/api/products/admin'),
          api.get<{ categories: Category[] }>('/api/categories'),
          api.get<{ items: CarouselItem[] }>('/api/carousels/instagram/admin'),
        ])
        setProducts(p.products)
        setCategories(c.categories)
        setIgItems(ig.items)
        if (user?.canManageUsers) {
          const u = await api.get<{ users: User[] }>('/api/users')
          setUsers(u.users)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      const cat = categories.find((c) => c.id === p.categoryId)
      const label = cat?.name || 'Sem categoria'
      counts.set(label, (counts.get(label) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, produtos: value }))
      .sort((a, b) => b.produtos - a.produtos)
  }, [products, categories])

  const statusData = useMemo(() => {
    const active = products.filter((p) => p.isActive).length
    const inactive = products.length - active
    return [
      { name: 'Ativos no site', value: active },
      { name: 'Ocultos', value: inactive },
    ].filter((d) => d.value > 0)
  }, [products])

  const bestsellerData = useMemo(() => {
    const yes = products.filter((p) => p.isBestseller).length
    const no = products.length - yes
    return [
      { name: 'Mais vendidos', value: yes },
      { name: 'Catálogo geral', value: no },
    ].filter((d) => d.value > 0)
  }, [products])

  const timelineData = useMemo(() => {
    const sorted = [...products].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    let running = 0
    return sorted.map((p) => {
      running += 1
      return {
        date: new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        total: running,
      }
    })
  }, [products])

  const avgPrice = useMemo(() => {
    if (products.length === 0) return 0
    return products.reduce((sum, p) => sum + p.price, 0) / products.length
  }, [products])

  if (loading) return <p className="text-ink/50">Carregando…</p>

  const PIE_COLORS = [GOLD, INK]
  const PIE_COLORS_2 = [GARNET, GOLD_BRIGHT]

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Olá, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-sm text-ink/55">Aqui está um resumo do site da Karla Angel.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Gem} value={products.length} label="Produtos cadastrados" />
        <StatCard icon={Tags} value={categories.length} label="Categorias" />
        <StatCard icon={Star} value={products.filter((p) => p.isBestseller).length} label="Mais vendidos" />
        <StatCard icon={ImageIcon} value={igItems.filter((i) => i.imageUrl).length} label="Fotos no carrossel" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Produtos por categoria</h2>
          <p className="mb-4 text-[13px] text-ink/50">Quantos produtos ativos em cada categoria</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0e211815" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: INK_SOFT }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: INK_SOFT }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#0e211808' }}
                contentStyle={{ borderRadius: 10, border: '1px solid #0e21181a', fontSize: 13 }}
              />
              <Bar dataKey="produtos" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-lg text-ink">Status dos produtos</h2>
          <p className="mb-2 text-[13px] text-ink/50">Ativos vs. ocultos no site</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #0e21181a', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-[12px] text-ink/60">
            {statusData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-lg text-ink">Mais vendidos vs. catálogo</h2>
          <p className="mb-2 text-[13px] text-ink/50">Distribuição da vitrine "Mais vendidos"</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={bestsellerData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {bestsellerData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS_2[i % PIE_COLORS_2.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #0e21181a', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-[12px] text-ink/60">
            {bestsellerData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS_2[i % PIE_COLORS_2.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Catálogo ao longo do tempo</h2>
          <p className="mb-4 text-[13px] text-ink/50">
            Total de produtos cadastrados acumulado · preço médio {formatBRL(avgPrice)}
          </p>
          {timelineData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0e211815" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: INK_SOFT }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: INK_SOFT }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #0e21181a', fontSize: 13 }} />
                <Area type="monotone" dataKey="total" stroke={GOLD} strokeWidth={2} fill="url(#goldFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-[13px] text-ink/40">
              Cadastre mais produtos em datas diferentes para ver a evolução aqui.
            </p>
          )}
        </div>
      </div>

      {products.some((p) => p.isLowStock) && (
        <Link
          to="/estoque"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-garnet/20 bg-garnet/5 p-5 transition-colors hover:bg-garnet/10"
        >
          <AlertTriangle size={20} className="shrink-0 text-garnet" />
          <div>
            <p className="text-[14px] font-semibold text-garnet">
              {products.filter((p) => p.isLowStock).length} produto(s) com estoque baixo
            </p>
            <p className="text-[12px] text-garnet/70">Toque para ver e repor no controle de estoque.</p>
          </div>
        </Link>
      )}

      {user?.canManageUsers && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <div className="flex items-center gap-3">
            <UsersIcon className="text-gold" size={20} strokeWidth={1.5} />
            <p className="text-[15px] text-ink">
              <strong className="font-semibold">{users.length}</strong> usuário{users.length !== 1 ? 's' : ''} com
              acesso ao painel
            </p>
          </div>
        </div>
      )}

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

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Gem
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <Icon className="text-gold" size={20} strokeWidth={1.5} />
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      <p className="text-[12px] text-ink/55">{label}</p>
    </div>
  )
}
