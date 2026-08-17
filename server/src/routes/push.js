import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store } from '../db/store.js'
import { requireAuth } from '../auth.js'
import { sendPushAlert } from '../services/notify.js'

export const pushRouter = Router()

pushRouter.use(requireAuth)

pushRouter.post('/subscribe', (req, res) => {
  const { endpoint, keys } = req.body || {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Inscrição de push inválida.' })
  }
  // Evita duplicar a mesma inscrição (ex: usuário clicou "ativar" de novo).
  store.pushSubscriptions.removeWhere((s) => s.endpoint === endpoint)
  store.pushSubscriptions.insert({
    id: nanoid(),
    userId: req.user.id,
    endpoint,
    keys,
    createdAt: new Date().toISOString(),
  })
  res.status(201).json({ ok: true })
})

pushRouter.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {}
  if (endpoint) store.pushSubscriptions.removeWhere((s) => s.endpoint === endpoint)
  res.json({ ok: true })
})

pushRouter.post('/test', async (req, res) => {
  try {
    await sendPushAlert('Teste de notificação', 'Se você recebeu isso, o push está funcionando. ✅')
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})
