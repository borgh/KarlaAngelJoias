import { Router } from 'express'
import { store } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'
import {
  sendEmailAlert,
  ensureVapidKeys,
  isWhatsAppServerConfigured,
  createWhatsAppInstance,
  getWhatsAppQrCode,
  getWhatsAppConnectionStatus,
  disconnectWhatsApp,
  sendWhatsAppAlert,
} from '../services/notify.js'
import { isPaymentConfigured } from '../services/mercadopago.js'

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

function serializeSettings(settings) {
  // Nunca devolve a senha em texto puro pro front — só informa se já
  // está configurada. Escrever de novo (PUT) é a única forma de trocar;
  // deixar o campo em branco no formulário mantém o valor atual.
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
    whatsappNotifyNumber: settings.whatsappNotifyNumber,
    whatsappServerConfigured: isWhatsAppServerConfigured(),
    pushVapidPublicKey: settings.push.vapidPublicKey,
    mercadopago: {
      mode: settings.mercadopago.mode,
      sandboxPublicKey: settings.mercadopago.sandboxPublicKey,
      sandboxAccessTokenSet: !!settings.mercadopago.sandboxAccessToken,
      productionPublicKey: settings.mercadopago.productionPublicKey,
      productionAccessTokenSet: !!settings.mercadopago.productionAccessToken,
      webhookSecretSet: !!settings.mercadopago.webhookSecret,
      configured: isPaymentConfigured(),
    },
    shipping: settings.shipping,
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
  if (body.whatsappNotifyNumber !== undefined) {
    patch.whatsappNotifyNumber = String(body.whatsappNotifyNumber || '').replace(/\D/g, '')
  }
  if (body.smtp) {
    patch.smtp = { ...body.smtp }
    // Campo de senha em branco = "não trocar" (nunca chega em branco de propósito).
    if (!patch.smtp.pass) delete patch.smtp.pass
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
    await sendWhatsAppAlert('✅ Teste de notificação do painel Karla Angel Joias. Se você recebeu isso, o WhatsApp está conectado corretamente.')
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

settingsRouter.get('/notifications/vapid-public-key', (req, res) => {
  const { vapidPublicKey } = ensureVapidKeys()
  res.json({ publicKey: vapidPublicKey })
})

// --- Conexão do WhatsApp (QR code) ---------------------------------------
// A URL/chave da Evolution API vêm de variável de ambiente do servidor
// (compartilhada com o VBMA, mas com uma instância própria) — aqui só
// se cria a instância e mostra o QR code pra conectar, como conectar
// um WhatsApp Web comum.

settingsRouter.get('/whatsapp/status', requirePermission('canEdit'), async (req, res) => {
  if (!isWhatsAppServerConfigured()) {
    return res.json({ configured: false, state: 'unconfigured' })
  }
  try {
    const state = await getWhatsAppConnectionStatus()
    res.json({ configured: true, state })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

settingsRouter.post('/whatsapp/connect', requirePermission('canEdit'), async (req, res) => {
  try {
    await createWhatsAppInstance()
    const qr = await getWhatsAppQrCode()
    res.json(qr)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

settingsRouter.post('/whatsapp/disconnect', requirePermission('canEdit'), async (req, res) => {
  try {
    await disconnectWhatsApp()
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// -----------------------------------------------------------------
// Pagamentos (Mercado Pago) e frete
// -----------------------------------------------------------------
settingsRouter.put('/payments', requirePermission('canEdit'), (req, res) => {
  const body = req.body || {}
  const patch = { mercadopago: {}, shipping: {} }

  if (body.mode !== undefined) {
    if (!['sandbox', 'production'].includes(body.mode)) {
      return res.status(400).json({ error: "mode precisa ser 'sandbox' ou 'production'." })
    }
    patch.mercadopago.mode = body.mode
  }
  // Campos deixados de fora do body (undefined) mantêm o valor atual —
  // assim o formulário não precisa reenviar a chave toda vez que só
  // troca o modo, por exemplo. Uma string vazia explícita APAGA a chave.
  if (body.sandboxPublicKey !== undefined) patch.mercadopago.sandboxPublicKey = body.sandboxPublicKey
  if (body.sandboxAccessToken !== undefined) patch.mercadopago.sandboxAccessToken = body.sandboxAccessToken
  if (body.productionPublicKey !== undefined) patch.mercadopago.productionPublicKey = body.productionPublicKey
  if (body.productionAccessToken !== undefined) patch.mercadopago.productionAccessToken = body.productionAccessToken
  if (body.webhookSecret !== undefined) patch.mercadopago.webhookSecret = body.webhookSecret

  if (body.flatRateCents !== undefined) patch.shipping.flatRateCents = Math.max(0, Number(body.flatRateCents) || 0)
  if (body.freeAboveCents !== undefined) patch.shipping.freeAboveCents = Math.max(0, Number(body.freeAboveCents) || 0)

  const updated = store.settings.update(patch)
  res.json({ settings: serializeSettings(updated) })
})
