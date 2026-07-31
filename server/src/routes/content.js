import { Router } from 'express'
import { store } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'

export const contentRouter = Router()

contentRouter.get('/', (req, res) => {
  res.json({ content: store.siteContent.all() })
})

contentRouter.put('/admin', requireAuth, requirePermission('canEdit'), (req, res) => {
  const { updates } = req.body || {}
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Envie "updates" como um objeto { chave: valor }.' })
  }
  const sanitized = Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, String(v ?? '')]))
  const content = store.siteContent.setMany(sanitized)
  res.json({ content })
})
