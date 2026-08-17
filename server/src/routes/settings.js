import { Router } from 'express'
import { store } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'
import { sendEmailAlert, sendWhatsAppAlert, ensureVapidKeys } from '../services/notify.js'

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

function serializeSettings(settings) {
  // Nunca devolve a senha/chave em texto puro pro front — só informa
  // se já está configurada. Escrever de novo (PUT) é a única forma de
  // trocar; deixar o campo em branco no formulário mantém o valor atual.
  return {
    globalMinStockThreshold: settings.globalMinStockThreshold,
    globalNotifyChannels: settings.globalNotifyChannels,
    smtp: {
      host: settings.smtp.host,
      port: settings.smtp.port,
      secure: settings.smtp.secure,
      user: settings.smtp.user,
      passSet: !!settings.smtp.pass,
      fromName: settings.smtp.fromName,
      fromEmail: settings.smtp.fromEmail,
      notifyToEmail: settings.smtp.notifyToEmail,
    },
    whatsapp: {
      apiUrl: settings.whatsapp.apiUrl,
      apiKeySet: !!settings.whatsapp.apiKey,
      instanceName: settings.whatsapp.instanceName,
      notifyNumber: settings.whatsapp.notifyNumber,
    },
    pushVapidPublicKey: settings.push.vapidPublicKey,
  }
}

settingsRouter.get('/notifications', (req, res) => {
  res.json({ settings: serializeSettings(store.settings.get()) })
})

settingsRouter.put('/notifications', requirePermission('canEdit'), (req, res) => {
  const body = req.body || {}
  const patch = {}

  if (body.globalMinStockThreshold !== undefined) {
    patch.globalMinStockThreshold = Number(body.globalMinStockThreshold) || 0
  }
  if (body.globalNotifyChannels !== undefined) {
    patch.globalNotifyChannels = body.globalNotifyChannels
  }
  if (body.smtp) {
    patch.smtp = { ...body.smtp }
    // Campo de senha em branco = "não trocar" (nunca chega em branco de propósito).
    if (!patch.smtp.pass) delete patch.smtp.pass
  }
  if (body.whatsapp) {
    patch.whatsapp = { ...body.whatsapp }
    if (!patch.whatsapp.apiKey) delete patch.whatsapp.apiKey
  }

  const updated = store.settings.update(patch)
  res.json({ settings: serializeSettings(updated) })
})

settingsRouter.post('/notifications/test-email', requirePermission('canEdit'), async (req, res) => {
  try {
    await sendEmailAlert(
      'Teste de notificação — Karla Angel Joias',
      '<p>Este é um e-mail de teste do painel administrativo. Se você recebeu isso, o SMTP está configurado corretamente. ✅</p>'
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

settingsRouter.post('/notifications/test-whatsapp', requirePermission('canEdit'), async (req, res) => {
  try {
    await sendWhatsAppAlert('✅ Teste de notificação do painel Karla Angel Joias. Se você recebeu isso, o WhatsApp está configurado corretamente.')
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

settingsRouter.get('/notifications/vapid-public-key', (req, res) => {
  const { vapidPublicKey } = ensureVapidKeys()
  res.json({ publicKey: vapidPublicKey })
})
