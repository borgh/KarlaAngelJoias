import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Gem,
  Tags,
  Image as ImageIcon,
  FileText,
  Users,
  Warehouse,
  Bell,
  LogOut,
  Menu,
  X,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { InstallPwaButton } from './InstallPwaButton'
import { InstallPwaBanner } from './InstallPwaBanner'
import { ALL_MOBILE_NAV_OPTIONS, DEFAULT_BOTTOM_NAV } from '../config/mobileNavOptions'

const NAV_ITEMS = [
  { to: '/', label: 'Visão geral', icon: LayoutGrid, end: true },
  { to: '/produtos', label: 'Produtos', icon: Gem },
  { to: '/estoque', label: 'Estoque', icon: Warehouse },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/conteudo', label: 'Textos do site', icon: FileText },
  { to: '/carrossel', label: 'Carrossel Instagram', icon: ImageIcon },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
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

  const bottomNavConfig =
    user?.bottomNavConfig && user.bottomNavConfig.length > 0 ? user.bottomNavConfig : DEFAULT_BOTTOM_NAV
  const bottomNavItems = bottomNavConfig
    .map((to) => ALL_MOBILE_NAV_OPTIONS.find((o) => o.to === to))
    .filter((o): o is NonNullable<typeof o> => !!o && (!o.requires || !!user?.[o.requires]))

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

          <NavLink
            to="/menu-inferior"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors lg:hidden ${
                isActive ? 'bg-gold text-ink font-semibold' : 'text-ivory/55 hover:bg-ivory/10'
              }`
            }
          >
            <Smartphone size={16} strokeWidth={1.6} />
            Menu inferior (celular)
          </NavLink>
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

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <InstallPwaBanner />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Barra de navegação inferior — só no celular, como um app de
          verdade. Atalhos configuráveis (até 4) + botão de menu fixo. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div
          className="grid gap-0.5 px-1 pt-1.5"
          style={{ gridTemplateColumns: `repeat(${bottomNavItems.length + 1}, minmax(0, 1fr))` }}
        >
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-gold' : 'text-ivory/50'
                }`
              }
            >
              <item.icon size={20} strokeWidth={1.7} />
              <span className="truncate max-w-full">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-ivory/50"
          >
            <Menu size={20} strokeWidth={1.7} />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
