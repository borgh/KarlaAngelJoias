import jwt from 'jsonwebtoken'
import { store } from './db/store.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido — configure a variável de ambiente antes de iniciar o servidor.')
}

const COOKIE_NAME = 'karlaangel_admin_session'
const TOKEN_TTL = '12h'

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

function getUserSafe(id) {
  const user = store.users.find((u) => u.id === id)
  if (!user) return null
  const { passwordHash, ...safe } = user
  return safe
}

// Exige um usuário autenticado e ativo. Anexa req.user.
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'Não autenticado.' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = getUserSafe(payload.sub)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Sessão inválida.' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão expirada, faça login novamente.' })
  }
}

// Exige uma permissão específica (canCreate, canEdit, canDelete, canManageUsers).
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user?.[permission]) {
      return res.status(403).json({ error: 'Você não tem permissão para esta ação.' })
    }
    next()
  }
}

export { getUserSafe, COOKIE_NAME }
