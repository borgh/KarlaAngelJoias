import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'

export const carouselRouter = Router()

carouselRouter.get('/:name', (req, res) => {
  const items = store.carouselItems
    .filter((i) => i.carousel === req.params.name && i.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  res.json({ items })
})

carouselRouter.get('/:name/admin', requireAuth, (req, res) => {
  const items = store.carouselItems
    .filter((i) => i.carousel === req.params.name)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  res.json({ items })
})

carouselRouter.post('/:name/admin', requireAuth, requirePermission('canCreate'), (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, sortOrder } = req.body || {}
  const item = store.carouselItems.insert({
    id: nanoid(),
    carousel: req.params.name,
    title: title || '',
    subtitle: subtitle || '',
    imageUrl: imageUrl || '',
    linkUrl: linkUrl || '',
    sortOrder: Number(sortOrder) || 0,
    isActive: true,
  })
  res.status(201).json({ item })
})

carouselRouter.put('/items/:id/admin', requireAuth, requirePermission('canEdit'), (req, res) => {
  const existing = store.carouselItems.find((i) => i.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Item não encontrado.' })
  const { title, subtitle, imageUrl, linkUrl, sortOrder, isActive } = req.body || {}
  const item = store.carouselItems.update(req.params.id, {
    title: title ?? existing.title,
    subtitle: subtitle ?? existing.subtitle,
    imageUrl: imageUrl ?? existing.imageUrl,
    linkUrl: linkUrl ?? existing.linkUrl,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
    isActive: isActive !== undefined ? !!isActive : existing.isActive,
  })
  res.json({ item })
})

carouselRouter.delete('/items/:id/admin', requireAuth, requirePermission('canDelete'), (req, res) => {
  const removed = store.carouselItems.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Item não encontrado.' })
  res.json({ ok: true })
})
