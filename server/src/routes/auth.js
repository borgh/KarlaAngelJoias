import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js'

export const authRouter = Router()

function serializeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    canCreate: !!row.can_create,
    canEdit: !!row.can_edit,
    canDelete: !!row.can_delete,
    canManageUsers: !!row.can_manage_users,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  }
}

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim())
  if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
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
  res.json({ user: serializeUser(req.user) })
})
