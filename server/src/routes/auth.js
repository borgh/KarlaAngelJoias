import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { store } from '../db/store.js'
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js'

export const authRouter = Router()

function serializeUser(user) {
  const { passwordHash, ...safe } = user
  return safe
}

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = store.users.find((u) => u.email === normalizedEmail)
  if (!user || !user.isActive || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  }

  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: serializeUser(user) })
})

authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// Preferência pessoal de cada usuário (quais atalhos aparecem na barra
// inferior no celular) — não é uma configuração administrativa, por
// isso fica aqui em vez de em /api/users (que exige canManageUsers).
authRouter.put('/bottom-nav-config', requireAuth, (req, res) => {
  const { bottomNavConfig } = req.body || {}
  if (!Array.isArray(bottomNavConfig)) {
    return res.status(400).json({ error: 'bottomNavConfig precisa ser uma lista de caminhos.' })
  }
  const user = store.users.update(req.user.id, { bottomNavConfig: bottomNavConfig.slice(0, 4) })
  res.json({ user: serializeUser(user) })
})
