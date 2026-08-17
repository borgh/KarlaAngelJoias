import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, ApiError } from '../context/AuthContext'
import { InstallPwaBanner } from '../components/InstallPwaBanner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: string })?.from || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink px-6 py-6">
      {/* Instalar não deveria depender de já estar logado — o banner
          aparece aqui também, não só depois de entrar no painel. */}
      <div className="absolute inset-x-0 top-0">
        <InstallPwaBanner />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-ivory">
            Karla Angel <span className="text-gold">Joias</span>
          </p>
          <p className="mt-1 text-[13px] uppercase tracking-[0.2em] text-ivory/50">Painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ivory/10 bg-ink-soft/60 p-7">
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ivory/60">
            E-mail
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-ivory/15 bg-transparent px-3 py-2.5 text-ivory outline-none focus:border-gold"
            placeholder="seu@email.com"
          />

          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ivory/60">
            Senha
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 w-full rounded-lg border border-ivory/15 bg-transparent px-3 py-2.5 text-ivory outline-none focus:border-gold"
            placeholder="••••••••"
          />

          {error && (
            <p className="mb-4 rounded-lg bg-garnet/20 px-3 py-2 text-[13px] text-ivory">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
