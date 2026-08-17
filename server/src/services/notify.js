import nodemailer from 'nodemailer'
import webpush from 'web-push'
import { store } from '../db/store.js'

// ---------------------------------------------------------------------
// Resolução de limite mínimo e canais de alerta: produto > categoria >
// padrão global. Cada nível só "vence" o de cima se tiver um valor
// explicitamente definido (não nulo/vazio) — assim dá pra configurar
// por produto, por categoria, ou deixar tudo no padrão geral.
// ---------------------------------------------------------------------
export function resolveStockRules(product) {
  const settings = store.settings.get()
  const category = product.categoryId ? store.categories.find((c) => c.id === product.categoryId) : null

  const threshold =
    product.minStockThreshold ?? category?.minStockThreshold ?? settings.globalMinStockThreshold ?? 0

  const channels =
    (product.notifyChannels && product.notifyChannels.length > 0 && product.notifyChannels) ||
    (category?.notifyChannels && category.notifyChannels.length > 0 && category.notifyChannels) ||
    settings.globalNotifyChannels ||
    []

  return { threshold, channels }
}

// ---------------------------------------------------------------------
// E-mail (SMTP configurável pelo admin)
// ---------------------------------------------------------------------
function getTransport() {
  const { smtp } = store.settings.get()
  if (!smtp.host || !smtp.user || !smtp.pass) return null
  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 587,
    secure: !!smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  })
}

export async function sendEmailAlert(subject, html) {
  const { smtp } = store.settings.get()
  const transport = getTransport()
  if (!transport || !smtp.notifyToEmail) {
    throw new Error('SMTP não configurado (host, usuário, senha e e-mail de destino são obrigatórios).')
  }
  await transport.sendMail({
    from: `"${smtp.fromName || 'Karla Angel Joias'}" <${smtp.fromEmail || smtp.user}>`,
    to: smtp.notifyToEmail,
    subject,
    html,
  })
}

// ---------------------------------------------------------------------
// WhatsApp (Evolution API — mesmo servidor usado pelo VBMA, mas com uma
// instância própria da Karla Angel Joias). URL e chave da API NUNCA
// ficam no banco de dados nem no código — só em variáveis de ambiente
// do container, como o JWT_SECRET. Cada negócio (VBMA, Karla Angel)
// tem seu próprio nome de instância, então são conexões de WhatsApp
// totalmente separadas dentro do mesmo servidor Evolution.
// ---------------------------------------------------------------------
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'karlaangeljoias'

export function isWhatsAppServerConfigured() {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY)
}

function evolutionHeaders() {
  return { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' }
}

function requireWhatsAppConfigured() {
  if (!isWhatsAppServerConfigured()) {
    throw new Error(
      'Evolution API não configurada neste servidor (faltam EVOLUTION_API_URL/EVOLUTION_API_KEY). Isso é configurado pelo administrador do servidor, não por aqui.'
    )
  }
}

// Cria a instância na Evolution API — idempotente (se já existir, ignora).
export async function createWhatsAppInstance() {
  requireWhatsAppConfigured()
  const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: evolutionHeaders(),
    body: JSON.stringify({
      instanceName: EVOLUTION_INSTANCE_NAME,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
  if (!res.ok && res.status !== 403 && res.status !== 409) {
    const body = await res.text().catch(() => '')
    throw new Error(`Falha ao criar instância (${res.status}): ${body.slice(0, 300)}`)
  }
}

// Busca o QR code atual (imagem base64) pra conectar via WhatsApp do celular.
export async function getWhatsAppQrCode() {
  requireWhatsAppConfigured()
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE_NAME}`, {
    headers: evolutionHeaders(),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Falha ao buscar QR code (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (data?.instance?.state === 'open') return { base64: null, connected: true }
  return { base64: data?.base64 ?? data?.qrcode?.base64 ?? null, connected: false }
}

export async function getWhatsAppConnectionStatus() {
  if (!isWhatsAppServerConfigured()) return 'unconfigured'
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`, {
    headers: evolutionHeaders(),
  })
  if (!res.ok) return 'close'
  const data = await res.json()
  return data?.instance?.state ?? data?.state ?? 'close'
}

export async function disconnectWhatsApp() {
  requireWhatsAppConfigured()
  await fetch(`${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE_NAME}`, {
    method: 'DELETE',
    headers: evolutionHeaders(),
  })
}

export async function sendWhatsAppAlert(text) {
  requireWhatsAppConfigured()
  const { whatsappNotifyNumber } = store.settings.get()
  if (!whatsappNotifyNumber) {
    throw new Error('Número de destino do WhatsApp não configurado.')
  }
  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
    method: 'POST',
    headers: evolutionHeaders(),
    body: JSON.stringify({ number: whatsappNotifyNumber, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Falha ao enviar WhatsApp (${res.status}): ${body.slice(0, 300)}`)
  }
}

// ---------------------------------------------------------------------
// Push (Web Push / VAPID) — envia pra todas as inscrições salvas
// (cada admin que ativou push no próprio navegador/celular).
// ---------------------------------------------------------------------
export function ensureVapidKeys() {
  const settings = store.settings.get()
  if (settings.push.vapidPublicKey && settings.push.vapidPrivateKey) return settings.push
  const keys = webpush.generateVAPIDKeys()
  const updated = store.settings.update({ push: { vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey } })
  return updated.push
}

export async function sendPushAlert(title, body, url = '/estoque') {
  const settings = store.settings.get()
  const { vapidPublicKey, vapidPrivateKey } = settings.push
  if (!vapidPublicKey || !vapidPrivateKey) return
  webpush.setVapidDetails('mailto:contato@karlaangeljoias.com.br', vapidPublicKey, vapidPrivateKey)

  const subs = store.pushSubscriptions.all()
  const payload = JSON.stringify({ title, body, url })

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      } catch (err) {
        // Inscrição expirada/inválida (410/404) — remove pra não tentar de novo.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          store.pushSubscriptions.remove(sub.id)
        } else {
          console.error('Falha ao enviar push:', err?.message || err)
        }
      }
    })
  )
}

// ---------------------------------------------------------------------
// Checagem de estoque baixo — chamada sempre que a quantidade de um
// produto muda. Só dispara alerta quando CRUZA o limite de cima pra
// baixo (evita spam a cada consulta/edição enquanto já está baixo);
// reseta o estado quando volta a subir acima do limite.
// ---------------------------------------------------------------------
export async function checkAndNotifyLowStock(product) {
  const { threshold, channels } = resolveStockRules(product)
  const isLow = product.stockQuantity <= threshold

  if (!isLow) {
    if (product.lowStockNotifiedAt) {
      store.products.update(product.id, { lowStockNotifiedAt: null })
    }
    return { isLow: false, notified: false }
  }

  if (product.lowStockNotifiedAt) {
    // Já notificado enquanto o estoque continua baixo — não repete.
    return { isLow: true, notified: false }
  }

  const title = `Estoque baixo: ${product.name}`
  const message = `O produto "${product.name}" está com ${product.stockQuantity} unidade(s) em estoque (limite mínimo: ${threshold}).`
  const results = { email: null, whatsapp: null, push: null }

  if (channels.includes('email')) {
    try {
      await sendEmailAlert(title, `<p>${message}</p><p>Acesse o painel para repor o estoque.</p>`)
      results.email = 'ok'
    } catch (err) {
      results.email = err.message
    }
  }
  if (channels.includes('whatsapp')) {
    try {
      await sendWhatsAppAlert(`⚠️ *${title}*\n\n${message}`)
      results.whatsapp = 'ok'
    } catch (err) {
      results.whatsapp = err.message
    }
  }
  if (channels.includes('push')) {
    try {
      await sendPushAlert(title, message)
      results.push = 'ok'
    } catch (err) {
      results.push = err.message
    }
  }

  store.products.update(product.id, { lowStockNotifiedAt: new Date().toISOString() })
  return { isLow: true, notified: true, results }
}
