import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { requireAuth, requirePermission } from '../auth.js'

export const productsRouter = Router()

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    price: row.price,
    badge: row.badge,
    description: row.description,
    imageUrl: row.image_url,
    isBestseller: !!row.is_bestseller,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// GET /api/products — lista pública (só produtos ativos)
productsRouter.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC')
    .all()
  res.json({ products: rows.map(serialize) })
})

// GET /api/admin/products — lista completa para o painel (inclui inativos)
productsRouter.get('/admin', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC').all()
  res.json({ products: rows.map(serialize) })
})

productsRouter.post('/admin', requireAuth, requirePermission('can_create'), (req, res) => {
  const { name, categoryId, price, badge, description, imageUrl, isBestseller, sortOrder } = req.body || {}
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Nome do produto é obrigatório.' })
  }
  const id = nanoid()
  db.prepare(
    `INSERT INTO products (id, name, category_id, price, badge, description, image_url, is_bestseller, sort_order)
     VALUES (@id, @name, @categoryId, @price, @badge, @description, @imageUrl, @isBestseller, @sortOrder)`
  ).run({
    id,
    name,
    categoryId: categoryId || null,
    price: Number(price) || 0,
    badge: badge || '',
    description: description || '',
    imageUrl: imageUrl || '',
    isBestseller: isBestseller ? 1 : 0,
    sortOrder: Number(sortOrder) || 0,
  })
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  res.status(201).json({ product: serialize(row) })
})

productsRouter.put('/admin/:id', requireAuth, requirePermission('can_edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado.' })

  const { name, categoryId, price, badge, description, imageUrl, isBestseller, isActive, sortOrder } = req.body || {}
  db.prepare(
    `UPDATE products SET
       name = @name, category_id = @categoryId, price = @price, badge = @badge,
       description = @description, image_url = @imageUrl, is_bestseller = @isBestseller,
       is_active = @isActive, sort_order = @sortOrder, updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id: req.params.id,
    name: name ?? existing.name,
    categoryId: categoryId ?? existing.category_id,
    price: price !== undefined ? Number(price) : existing.price,
    badge: badge ?? existing.badge,
    description: description ?? existing.description,
    imageUrl: imageUrl ?? existing.image_url,
    isBestseller: isBestseller !== undefined ? (isBestseller ? 1 : 0) : existing.is_bestseller,
    isActive: isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sort_order,
  })
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  res.json({ product: serialize(row) })
})

productsRouter.delete('/admin/:id', requireAuth, requirePermission('can_delete'), (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Produto não encontrado.' })
  res.json({ ok: true })
})
