import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { requireAuth, requirePermission } from '../auth.js'

export const usersRouter = Router()

const SAFE_FIELDS =
  'id, name, email, can_create, can_edit, can_delete, can_manage_users, is_active, created_at'

function serialize(row) {
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

usersRouter.use(requireAuth, requirePermission('can_manage_users'))

usersRouter.get('/', (req, res) => {
  const rows = db.prepare(`SELECT ${SAFE_FIELDS} FROM users ORDER BY created_at ASC`).all()
  res.json({ users: rows.map(serialize) })
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
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
  if (exists) return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' })

  const id = nanoid()
  const hash = bcrypt.hashSync(password, 10)
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, can_create, can_edit, can_delete, can_manage_users)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    normalizedEmail,
    hash,
    canCreate ? 1 : 0,
    canEdit ? 1 : 0,
    canDelete ? 1 : 0,
    canManageUsers ? 1 : 0
  )
  const row = db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(id)
  res.status(201).json({ user: serialize(row) })
})

usersRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' })

  // Impede que o último admin com can_manage_users remova essa permissão de si mesmo,
  // deixando o painel sem ninguém que possa gerenciar usuários.
  const { name, email, password, canCreate, canEdit, canDelete, canManageUsers, isActive } = req.body || {}
  if (
    existing.id === req.user.id &&
    existing.can_manage_users &&
    canManageUsers === false
  ) {
    const otherManagers = db
      .prepare('SELECT COUNT(*) AS n FROM users WHERE can_manage_users = 1 AND id != ?')
      .get(existing.id).n
    if (otherManagers === 0) {
      return res.status(400).json({ error: 'Não é possível remover a última permissão de gestão de usuários.' })
    }
  }

  const passwordHash = password ? bcrypt.hashSync(password, 10) : existing.password_hash

  db.prepare(
    `UPDATE users SET
       name=@name, email=@email, password_hash=@password_hash,
       can_create=@can_create, can_edit=@can_edit, can_delete=@can_delete,
       can_manage_users=@can_manage_users, is_active=@is_active
     WHERE id=@id`
  ).run({
    id: req.params.id,
    name: name ?? existing.name,
    email: email ? String(email).toLowerCase().trim() : existing.email,
    password_hash: passwordHash,
    can_create: canCreate !== undefined ? (canCreate ? 1 : 0) : existing.can_create,
    can_edit: canEdit !== undefined ? (canEdit ? 1 : 0) : existing.can_edit,
    can_delete: canDelete !== undefined ? (canDelete ? 1 : 0) : existing.can_delete,
    can_manage_users: canManageUsers !== undefined ? (canManageUsers ? 1 : 0) : existing.can_manage_users,
    is_active: isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
  })

  const row = db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(req.params.id)
  res.json({ user: serialize(row) })
})

usersRouter.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' })
  }
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json({ ok: true })
})
