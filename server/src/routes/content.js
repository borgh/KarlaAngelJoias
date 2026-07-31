import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAuth, requirePermission } from '../auth.js'

export const contentRouter = Router()

// GET /api/site-content — devolve tudo como um objeto { chave: valor }, público.
contentRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all()
  const content = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  res.json({ content })
})

// PUT /api/site-content/admin — atualiza várias chaves de uma vez: { updates: { key: value } }
contentRouter.put('/admin', requireAuth, requirePermission('can_edit'), (req, res) => {
  const { updates } = req.body || {}
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Envie "updates" como um objeto { chave: valor }.' })
  }
  const stmt = db.prepare(
    `INSERT INTO site_content (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  )
  const tx = db.transaction((entries) => {
    for (const [key, value] of entries) stmt.run(key, String(value ?? ''))
  })
  tx(Object.entries(updates))

  const rows = db.prepare('SELECT key, value FROM site_content').all()
  res.json({ content: Object.fromEntries(rows.map((r) => [r.key, r.value])) })
})
