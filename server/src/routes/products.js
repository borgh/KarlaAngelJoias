import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store, nowIso } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'

export const productsRouter = Router()

productsRouter.get('/', (req, res) => {
  const products = store.products
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt))
  res.json({ products })
})

productsRouter.get('/admin', requireAuth, (req, res) => {
  const products = store.products
    .all()
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt))
  res.json({ products })
})

productsRouter.post('/admin', requireAuth, requirePermission('canCreate'), (req, res) => {
  const { name, categoryId, price, badge, description, imageUrl, isBestseller, sortOrder } = req.body || {}
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Nome do produto é obrigatório.' })
  }
  const now = nowIso()
  const product = store.products.insert({
    id: nanoid(),
    name,
    categoryId: categoryId || null,
    price: Number(price) || 0,
    badge: badge || '',
    description: description || '',
    imageUrl: imageUrl || '',
    isBestseller: !!isBestseller,
    isActive: true,
    sortOrder: Number(sortOrder) || 0,
    createdAt: now,
    updatedAt: now,
  })
  res.status(201).json({ product })
})

productsRouter.put('/admin/:id', requireAuth, requirePermission('canEdit'), (req, res) => {
  const existing = store.products.find((p) => p.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado.' })

  const { name, categoryId, price, badge, description, imageUrl, isBestseller, isActive, sortOrder } = req.body || {}
  const product = store.products.update(req.params.id, {
    name: name ?? existing.name,
    categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
    price: price !== undefined ? Number(price) : existing.price,
    badge: badge ?? existing.badge,
    description: description ?? existing.description,
    imageUrl: imageUrl ?? existing.imageUrl,
    isBestseller: isBestseller !== undefined ? !!isBestseller : existing.isBestseller,
    isActive: isActive !== undefined ? !!isActive : existing.isActive,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
    updatedAt: nowIso(),
  })
  res.json({ product })
})

productsRouter.delete('/admin/:id', requireAuth, requirePermission('canDelete'), (req, res) => {
  const removed = store.products.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Produto não encontrado.' })
  res.json({ ok: true })
})
