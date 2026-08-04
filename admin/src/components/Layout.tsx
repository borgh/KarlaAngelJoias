import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Gem,
  Tags,
  Image as ImageIcon,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { InstallPwaButton } from './InstallPwaButton'

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
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const currentLabel = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label

  const sidebarContent = (
    <>
      <div>
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <p className="font-display text-lg">
              Karla Angel <span className="text-gold">Joias</span>
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-ivory/45">Admin</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="text-ivory/60 hover:text-ivory lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV_ITEMS.filter((item) => !item.requires || user?.[item.requires]).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
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

      <div className="space-y-4 border-t border-ivory/10 p-4">
        <InstallPwaButton />
        <div>
          <p className="truncate text-[13px] font-medium">{user?.name}</p>
          <p className="truncate text-[12px] text-ivory/50">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-[13px] text-ivory/70 transition-colors hover:text-gold"
          >
            <LogOut size={15} strokeWidth={1.6} /> Sair
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-ivory-dim lg:flex">
      {/* Barra superior — só no celular/tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-ink px-4 py-3.5 text-ivory lg:hidden">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="text-ivory">
          <Menu size={22} />
        </button>
        <p className="font-display text-[15px]">{currentLabel || 'Karla Angel Joias'}</p>
        <div className="w-[22px]" />
      </header>

      {/* Gaveta lateral — celular/tablet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col justify-between bg-ink text-ivory shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Sidebar fixa — telas grandes */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-ink text-ivory lg:flex">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
