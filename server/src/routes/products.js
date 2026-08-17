import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store, nowIso } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'
import { checkAndNotifyLowStock, resolveStockRules } from '../services/notify.js'

export const productsRouter = Router()

function serializeWithStockInfo(row) {
  const { threshold } = resolveStockRules(row)
  return {
    ...row,
    effectiveMinStockThreshold: threshold,
    isLowStock: row.stockQuantity <= threshold,
  }
}

function serializePublic(row) {
  const { threshold } = resolveStockRules(row)
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    price: row.price,
    badge: row.badge,
    description: row.description,
    imageUrl: row.imageUrl,
    isBestseller: row.isBestseller,
    sortOrder: row.sortOrder,
    stockQuantity: row.stockQuantity,
    isLowStock: row.stockQuantity <= threshold,
  }
}

productsRouter.get('/', (req, res) => {
  const products = store.products
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt))
    .map(serializePublic)
  res.json({ products })
})

productsRouter.get('/admin', requireAuth, (req, res) => {
  const products = store.products
    .all()
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt))
    .map(serializeWithStockInfo)
  res.json({ products })
})

// Visão rápida de estoque baixo — usada no dashboard e na tela de Estoque.
productsRouter.get('/admin/low-stock', requireAuth, (req, res) => {
  const products = store.products
    .all()
    .map(serializeWithStockInfo)
    .filter((p) => p.isLowStock)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
  res.json({ products })
})

productsRouter.post('/admin', requireAuth, requirePermission('canCreate'), (req, res) => {
  const {
    name,
    categoryId,
    price,
    badge,
    description,
    imageUrl,
    isBestseller,
    sortOrder,
    stockQuantity,
    minStockThreshold,
    notifyChannels,
  } = req.body || {}
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
    stockQuantity: Number.isFinite(Number(stockQuantity)) ? Number(stockQuantity) : 0,
    minStockThreshold: minStockThreshold === '' || minStockThreshold === undefined ? null : Number(minStockThreshold),
    notifyChannels: Array.isArray(notifyChannels) && notifyChannels.length > 0 ? notifyChannels : null,
    lowStockNotifiedAt: null,
    createdAt: now,
    updatedAt: now,
  })
  checkAndNotifyLowStock(product).catch((err) => console.error('Falha ao checar estoque baixo:', err))
  res.status(201).json({ product: serializeWithStockInfo(product) })
})

productsRouter.put('/admin/:id', requireAuth, requirePermission('canEdit'), (req, res) => {
  const existing = store.products.find((p) => p.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado.' })

  const {
    name,
    categoryId,
    price,
    badge,
    description,
    imageUrl,
    isBestseller,
    isActive,
    sortOrder,
    stockQuantity,
    minStockThreshold,
    notifyChannels,
  } = req.body || {}

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
    stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : existing.stockQuantity,
    minStockThreshold:
      minStockThreshold !== undefined
        ? minStockThreshold === '' || minStockThreshold === null
          ? null
          : Number(minStockThreshold)
        : existing.minStockThreshold,
    notifyChannels:
      notifyChannels !== undefined
        ? Array.isArray(notifyChannels) && notifyChannels.length > 0
          ? notifyChannels
          : null
        : existing.notifyChannels,
    updatedAt: nowIso(),
  })

  checkAndNotifyLowStock(product).catch((err) => console.error('Falha ao checar estoque baixo:', err))
  res.json({ product: serializeWithStockInfo(product) })
})

// Ajuste rápido de estoque (botões +/- ou "definir quantidade" na tela
// de Estoque) — dispara a checagem de limite mínimo automaticamente.
productsRouter.patch('/admin/:id/stock', requireAuth, requirePermission('canEdit'), async (req, res) => {
  const existing = store.products.find((p) => p.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado.' })

  const { delta, quantity } = req.body || {}
  let newQuantity = existing.stockQuantity
  if (delta !== undefined) newQuantity = existing.stockQuantity + Number(delta)
  if (quantity !== undefined) newQuantity = Number(quantity)
  if (!Number.isFinite(newQuantity)) {
    return res.status(400).json({ error: 'Quantidade inválida.' })
  }
  newQuantity = Math.max(0, newQuantity)

  const product = store.products.update(req.params.id, { stockQuantity: newQuantity, updatedAt: nowIso() })
  const result = await checkAndNotifyLowStock(product).catch((err) => {
    console.error('Falha ao checar estoque baixo:', err)
    return null
  })
  // checkAndNotifyLowStock pode ter mudado lowStockNotifiedAt por baixo
  // dos panos (reset ao subir do estoque, ou marcado ao notificar) —
  // busca de novo pra devolver o estado realmente final.
  const finalProduct = store.products.find((p) => p.id === req.params.id)
  res.json({ product: serializeWithStockInfo(finalProduct), notification: result })
})

productsRouter.delete('/admin/:id', requireAuth, requirePermission('canDelete'), (req, res) => {
  const removed = store.products.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Produto não encontrado.' })
  res.json({ ok: true })
})
