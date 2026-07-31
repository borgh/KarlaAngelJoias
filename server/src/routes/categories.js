import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', (req, res) => {
  const categories = store.categories.all().sort((a, b) => a.sortOrder - b.sortOrder)
  res.json({ categories })
})

categoriesRouter.post('/admin', requireAuth, requirePermission('canCreate'), (req, res) => {
  const { name, description, glyph, sortOrder } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' })
  const category = store.categories.insert({
    id: nanoid(),
    name,
    description: description || '',
    glyph: glyph || 'ring',
    sortOrder: Number(sortOrder) || 0,
  })
  res.status(201).json({ category })
})

categoriesRouter.put('/admin/:id', requireAuth, requirePermission('canEdit'), (req, res) => {
  const existing = store.categories.find((c) => c.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Categoria não encontrada.' })
  const { name, description, glyph, sortOrder } = req.body || {}
  const category = store.categories.update(req.params.id, {
    name: name ?? existing.name,
    description: description ?? existing.description,
    glyph: glyph ?? existing.glyph,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
  })
  res.json({ category })
})

categoriesRouter.delete('/admin/:id', requireAuth, requirePermission('canDelete'), (req, res) => {
  store.products.updateWhere((p) => p.categoryId === req.params.id, { categoryId: null })
  const removed = store.categories.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Categoria não encontrada.' })
  res.json({ ok: true })
})
