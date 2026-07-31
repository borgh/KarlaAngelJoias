import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { requireAuth, requirePermission } from '../auth.js'

export const carouselRouter = Router()

function serialize(row) {
  return {
    id: row.id,
    carousel: row.carousel,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    sortOrder: row.sort_order,
    isActive: !!row.is_active,
  }
}

// GET /api/carousels/:name — itens ativos de um carrossel específico (público)
carouselRouter.get('/:name', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM carousel_items WHERE carousel = ? AND is_active = 1 ORDER BY sort_order ASC')
    .all(req.params.name)
  res.json({ items: rows.map(serialize) })
})

// GET /api/carousels/:name/admin — todos os itens (inclui inativos)
carouselRouter.get('/:name/admin', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM carousel_items WHERE carousel = ? ORDER BY sort_order ASC')
    .all(req.params.name)
  res.json({ items: rows.map(serialize) })
})

carouselRouter.post('/:name/admin', requireAuth, requirePermission('can_create'), (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, sortOrder } = req.body || {}
  const id = nanoid()
  db.prepare(
    `INSERT INTO carousel_items (id, carousel, title, subtitle, image_url, link_url, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.params.name, title || '', subtitle || '', imageUrl || '', linkUrl || '', Number(sortOrder) || 0)
  const row = db.prepare('SELECT * FROM carousel_items WHERE id = ?').get(id)
  res.status(201).json({ item: serialize(row) })
})

carouselRouter.put('/items/:id/admin', requireAuth, requirePermission('can_edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM carousel_items WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Item não encontrado.' })
  const { title, subtitle, imageUrl, linkUrl, sortOrder, isActive } = req.body || {}
  db.prepare(
    `UPDATE carousel_items SET title=?, subtitle=?, image_url=?, link_url=?, sort_order=?, is_active=? WHERE id=?`
  ).run(
    title ?? existing.title,
    subtitle ?? existing.subtitle,
    imageUrl ?? existing.image_url,
    linkUrl ?? existing.link_url,
    sortOrder !== undefined ? Number(sortOrder) : existing.sort_order,
    isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    req.params.id
  )
  res.json({ item: serialize(db.prepare('SELECT * FROM carousel_items WHERE id = ?').get(req.params.id)) })
})

carouselRouter.delete('/items/:id/admin', requireAuth, requirePermission('can_delete'), (req, res) => {
  const info = db.prepare('DELETE FROM carousel_items WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Item não encontrado.' })
  res.json({ ok: true })
})
