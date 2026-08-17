import {
  LayoutGrid,
  Gem,
  Tags,
  Image as ImageIcon,
  FileText,
  Users,
  Warehouse,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { User } from '../lib/types'

export interface MobileNavOption {
  to: string
  label: string
  icon: LucideIcon
  requires?: keyof User
}

// Mesma lista de telas de primeiro nível que existe em NAV_ITEMS no
// Layout — candidatas a virar atalho fixo na barra inferior do celular.
export const ALL_MOBILE_NAV_OPTIONS: MobileNavOption[] = [
  { to: '/', label: 'Visão geral', icon: LayoutGrid },
  { to: '/produtos', label: 'Produtos', icon: Gem },
  { to: '/estoque', label: 'Estoque', icon: Warehouse },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/conteudo', label: 'Textos do site', icon: FileText },
  { to: '/carrossel', label: 'Carrossel Instagram', icon: ImageIcon },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/usuarios', label: 'Usuários', icon: Users, requires: 'canManageUsers' },
]

// Usado quando o usuário nunca configurou nada (bottomNavConfig vazio).
export const DEFAULT_BOTTOM_NAV = ['/', '/produtos', '/estoque']
