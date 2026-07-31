import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Gem,
  Tags,
  Image as ImageIcon,
  FileText,
  Users,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Visão geral', icon: LayoutGrid, end: true },
  { to: '/produtos', label: 'Produtos', icon: Gem },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/conteudo', label: 'Textos do site', icon: FileText },
  { to: '/carrossel', label: 'Carrossel Instagram', icon: ImageIcon },
  { to: '/usuarios', label: 'Usuários', icon: Users, requires: 'canManageUsers' as const },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-ivory-dim">
      <aside className="flex w-64 shrink-0 flex-col justify-between bg-ink text-ivory">
        <div>
          <div className="px-6 py-6">
            <p className="font-display text-lg">
              Karla Angel <span className="text-gold">Joias</span>
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-ivory/45">Admin</p>
          </div>

          <nav className="mt-2 flex flex-col gap-1 px-3">
            {NAV_ITEMS.filter((item) => !item.requires || user?.[item.requires]).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                    isActive ? 'bg-gold text-ink font-semibold' : 'text-ivory/75 hover:bg-ivory/10'
                  }`
                }
              >
                <item.icon size={17} strokeWidth={1.6} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-ivory/10 p-4">
          <p className="truncate text-[13px] font-medium">{user?.name}</p>
          <p className="truncate text-[12px] text-ivory/50">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-[13px] text-ivory/70 transition-colors hover:text-gold"
          >
            <LogOut size={15} strokeWidth={1.6} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
