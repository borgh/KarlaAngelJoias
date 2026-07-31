import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { requireAuth, requirePermission } from '../auth.js'

export const categoriesRouter = Router()

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    glyph: row.glyph,
    sortOrder: row.sort_order,
  }
}

categoriesRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all()
  res.json({ categories: rows.map(serialize) })
})

categoriesRouter.post('/admin', requireAuth, requirePermission('can_create'), (req, res) => {
  const { name, description, glyph, sortOrder } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' })
  const id = nanoid()
  db.prepare(
    `INSERT INTO categories (id, name, description, glyph, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, description || '', glyph || 'ring', Number(sortOrder) || 0)
  res.status(201).json({ category: serialize(db.prepare('SELECT * FROM categories WHERE id = ?').get(id)) })
})

categoriesRouter.put('/admin/:id', requireAuth, requirePermission('can_edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Categoria não encontrada.' })
  const { name, description, glyph, sortOrder } = req.body || {}
  db.prepare(
    `UPDATE categories SET name = ?, description = ?, glyph = ?, sort_order = ? WHERE id = ?`
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    glyph ?? existing.glyph,
    sortOrder !== undefined ? Number(sortOrder) : existing.sort_order,
    req.params.id
  )
  res.json({ category: serialize(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)) })
})

categoriesRouter.delete('/admin/:id', requireAuth, requirePermission('can_delete'), (req, res) => {
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(req.params.id)
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada.' })
  res.json({ ok: true })
})
