import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { store, nowIso } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'

export const usersRouter = Router()

function serialize(user) {
  const { passwordHash, ...safe } = user
  return safe
}

usersRouter.use(requireAuth, requirePermission('canManageUsers'))

usersRouter.get('/', (req, res) => {
  const users = store.users.all().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  res.json({ users: users.map(serialize) })
})

usersRouter.post('/', (req, res) => {
  const { name, email, password, canCreate, canEdit, canDelete, canManageUsers } = req.body || {}
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' })
  }
  const normalizedEmail = String(email).toLowerCase().trim()
  const exists = store.users.find((u) => u.email === normalizedEmail)
  if (exists) return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' })

  const user = store.users.insert({
    id: nanoid(),
    name,
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    canCreate: !!canCreate,
    canEdit: !!canEdit,
    canDelete: !!canDelete,
    canManageUsers: !!canManageUsers,
    isActive: true,
    createdAt: nowIso(),
  })
  res.status(201).json({ user: serialize(user) })
})

usersRouter.put('/:id', (req, res) => {
  const existing = store.users.find((u) => u.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' })

  const { name, email, password, canCreate, canEdit, canDelete, canManageUsers, isActive } = req.body || {}

  // Impede remover a última permissão de gestão de usuários do sistema.
  if (existing.id === req.user.id && existing.canManageUsers && canManageUsers === false) {
    const otherManagers = store.users.filter((u) => u.canManageUsers && u.id !== existing.id).length
    if (otherManagers === 0) {
      return res.status(400).json({ error: 'Não é possível remover a última permissão de gestão de usuários.' })
    }
  }

  const user = store.users.update(req.params.id, {
    name: name ?? existing.name,
    email: email ? String(email).toLowerCase().trim() : existing.email,
    passwordHash: password ? bcrypt.hashSync(password, 10) : existing.passwordHash,
    canCreate: canCreate !== undefined ? !!canCreate : existing.canCreate,
    canEdit: canEdit !== undefined ? !!canEdit : existing.canEdit,
    canDelete: canDelete !== undefined ? !!canDelete : existing.canDelete,
    canManageUsers: canManageUsers !== undefined ? !!canManageUsers : existing.canManageUsers,
    isActive: isActive !== undefined ? !!isActive : existing.isActive,
  })
  res.json({ user: serialize(user) })
})

usersRouter.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' })
  }
  const removed = store.users.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json({ ok: true })
})
