import { MercadoPagoConfig, Payment } from 'mercadopago'
import crypto from 'node:crypto'
import { store } from '../db/store.js'

// Encapsula toda a integração com o Mercado Pago — o resto do sistema
// nunca importa o SDK diretamente, só essas funções. Isso deixa um
// único lugar responsável por decidir QUAL par de chaves usar
// (sandbox vs produção) e por nunca deixar a chave secreta vazar pra
// fora do servidor.

function activeAccessToken(settings) {
  const mp = settings.mercadopago
  return mp.mode === 'production' ? mp.productionAccessToken : mp.sandboxAccessToken
}

function activePublicKey(settings) {
  const mp = settings.mercadopago
  return mp.mode === 'production' ? mp.productionPublicKey : mp.sandboxPublicKey
}

// A cliente ainda não liberou o acesso ao Mercado Pago Developers —
// até lá isso retorna false em todo lugar do site, e o checkout mostra
// uma mensagem clara em vez de tentar cobrar com uma chave vazia (o
// que só resultaria num erro confuso do SDK).
export function isPaymentConfigured() {
  const settings = store.settings.get()
  return !!activeAccessToken(settings) && !!activePublicKey(settings)
}

// Chave PÚBLICA — segura de expor pro navegador (é o que inicializa o
// Payment Brick no checkout). Nunca devolver a chave de acesso (secreta)
// pro cliente; essa só é usada aqui dentro, nas chamadas ao SDK.
export function getPublicPaymentInfo() {
  const settings = store.settings.get()
  return {
    configured: isPaymentConfigured(),
    publicKey: activePublicKey(settings),
    mode: settings.mercadopago.mode,
    shipping: settings.shipping, // não é segredo — o checkout usa pra estimar o frete antes de criar o pedido
  }
}

function getClient() {
  const settings = store.settings.get()
  const accessToken = activeAccessToken(settings)
  if (!accessToken) {
    throw new Error(
      'Mercado Pago ainda não configurado — cadastre as chaves em Configurações → Pagamentos no painel admin.'
    )
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } })
}

// Cria a cobrança de verdade no Mercado Pago a partir dos dados já
// tokenizados pelo Payment Brick no navegador (o número do cartão em
// si NUNCA passa pelo nosso servidor — só o token gerado pelo SDK do
// MP no cliente, isso é o que mantém o site fora do escopo de PCI-DSS
// pra dados de cartão).
export async function createPayment({ order, brickData, idempotencyKey }) {
  const client = getClient()
  const payment = new Payment(client)

  const body = {
    transaction_amount: order.totalCents / 100,
    description: `Pedido #${order.number} — Karla Angel`,
    payment_method_id: brickData.payment_method_id,
    token: brickData.token,
    installments: brickData.installments || 1,
    issuer_id: brickData.issuer_id,
    payer: {
      email: order.customer.email,
      first_name: order.customer.name.split(' ')[0],
      last_name: order.customer.name.split(' ').slice(1).join(' ') || order.customer.name,
      identification: brickData.payer?.identification,
    },
    external_reference: order.id,
    notification_url: process.env.MP_WEBHOOK_URL || undefined,
    metadata: { orderId: order.id, orderNumber: order.number },
  }

  return payment.create({ body, requestOptions: { idempotencyKey } })
}

export async function getPayment(paymentId) {
  const client = getClient()
  const payment = new Payment(client)
  return payment.get({ id: paymentId })
}

// Valida a assinatura x-signature que o Mercado Pago manda no
// webhook, quando um "webhookSecret" foi configurado. Se não foi
// configurado ainda, deixa passar (a própria criação do pagamento já
// exige as chaves corretas — o webhook só antecipa a confirmação; sem
// ele, a consulta manual de status no admin ainda funciona).
export function verifyWebhookSignature(req) {
  const settings = store.settings.get()
  const secret = settings.mercadopago.webhookSecret
  if (!secret) return true

  const signatureHeader = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (!signatureHeader) return false

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((p) => p.trim().split('='))
      .map(([k, ...v]) => [k, v.join('=')])
  )
  const ts = parts.ts
  const hash = parts.v1
  const dataId = req.query['data.id'] || req.body?.data?.id
  if (!ts || !hash || !dataId) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return computed === hash
}
