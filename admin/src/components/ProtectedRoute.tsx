import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { User } from '../lib/types'

export function ProtectedRoute({
  children,
  requires,
}: {
  children: ReactNode
  requires?: keyof User
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink/50">Carregando…</div>
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (requires && !user[requires]) {
    return (
      <div className="p-10 text-center text-ink/60">
        Você não tem permissão para acessar esta página.
      </div>
    )
  }
  return <>{children}</>
}
