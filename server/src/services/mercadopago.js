import { MercadoPagoConfig, Order, WebhookSignatureValidator } from 'mercadopago'
import { store } from '../db/store.js'

// Encapsula toda a integração com o Mercado Pago — o resto do sistema
// nunca importa o SDK diretamente, só essas funções. Isso deixa um
// único lugar responsável por decidir QUAL par de chaves usar
// (sandbox vs produção) e por nunca deixar a chave secreta vazar pra
// fora do servidor.
//
// Usa a API de ORDERS (Checkout Transparente via Orders) — a API de
// Payments (/v1/payments) está sendo descontinuada pelo MP. A
// diferença prática: cada cobrança vira uma "order" (id "ORD...") com
// uma lista de transações, os status têm outros nomes (processed em
// vez de approved, failed em vez de rejected, canceled com um L só) e
// o webhook chega no tópico "order" em vez de "payment".

function activeAccessToken(settings) {
  const mp = settings.mercadopago
  return mp.mode === 'production' ? mp.productionAccessToken : mp.sandboxAccessToken
}

function activePublicKey(settings) {
  const mp = settings.mercadopago
  return mp.mode === 'production' ? mp.productionPublicKey : mp.sandboxPublicKey
}

// Enquanto as chaves não estiverem cadastradas isso retorna false em
// todo lugar do site, e o checkout mostra uma mensagem clara em vez de
// tentar cobrar com uma chave vazia (o que só resultaria num erro
// confuso do SDK).
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
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } })
}

// A API de Orders exige valores como string "12.34" (não number).
function toAmount(cents) {
  return (cents / 100).toFixed(2)
}

// O Payment Brick entrega `payment_method_id` (visa, master, pix...) e,
// no segundo argumento do onSubmit, `paymentTypeId` (credit_card,
// debit_card, bank_transfer...). O front manda os dois; se por algum
// motivo o tipo não vier, deduz a partir do id.
function resolvePaymentType(brickData) {
  const explicit = brickData.paymentTypeId || brickData.payment_type_id || brickData.selectedPaymentMethod
  if (explicit) return String(explicit)
  if (brickData.payment_method_id === 'pix') return 'bank_transfer'
  return 'credit_card'
}

// Cria a cobrança de verdade no Mercado Pago a partir dos dados já
// tokenizados pelo Payment Brick no navegador (o número do cartão em
// si NUNCA passa pelo nosso servidor — só o token gerado pelo SDK do
// MP no cliente, isso é o que mantém o site fora do escopo de PCI-DSS
// pra dados de cartão).
export async function createOrder({ order, brickData, idempotencyKey }) {
  const client = getClient()
  const orders = new Order(client)

  const paymentType = resolvePaymentType(brickData)
  const isPix = paymentType === 'bank_transfer' || brickData.payment_method_id === 'pix'

  const paymentMethod = isPix
    ? {
        id: 'pix',
        type: 'bank_transfer',
      }
    : {
        id: brickData.payment_method_id,
        type: paymentType,
        token: brickData.token,
        installments: Number(brickData.installments) || 1,
      }

  const nameParts = String(order.customer.name).trim().split(/\s+/)
  const identification = brickData.payer?.identification
  const payer = {
    email: order.customer.email,
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(' ') || nameParts[0],
    ...(identification?.type && identification?.number
      ? { identification: { type: identification.type, number: String(identification.number) } }
      : {}),
  }

  const body = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: toAmount(order.totalCents),
    external_reference: order.id,
    description: `Pedido #${order.number} — Karla Angel`,
    payer,
    transactions: {
      payments: [
        {
          amount: toAmount(order.totalCents),
          payment_method: paymentMethod,
          // Pix: o QR code vale por 1 dia — depois disso o pedido fica
          // "cancelled" pelo próprio MP e a cliente precisa refazer.
          ...(isPix ? { expiration_time: 'P1D' } : {}),
        },
      ],
    },
    items: order.items.map((i) => ({
      title: i.name,
      unit_price: toAmount(i.priceCents),
      quantity: i.quantity,
      external_code: i.productId,
    })),
  }

  const response = await orders.create({ body, requestOptions: { idempotencyKey } })
  return summarizeOrder(response)
}

export async function getOrder(mpOrderId) {
  const client = getClient()
  const orders = new Order(client)
  const response = await orders.get({ id: mpOrderId })
  return summarizeOrder(response)
}

// Traduz a resposta crua da API de Orders pro vocabulário que o resto
// do sistema (rotas, admin, site) já entende: approved / pending /
// rejected / cancelled / refunded. Assim a troca de API fica contida
// aqui — ninguém fora deste arquivo precisa saber que o MP chama
// pagamento aprovado de "processed".
const ORDER_STATUS_MAP = {
  processed: 'approved',
  failed: 'rejected',
  canceled: 'cancelled',
  cancelled: 'cancelled',
  expired: 'cancelled',
  refunded: 'refunded',
  charged_back: 'charged_back',
  action_required: 'pending', // Pix aguardando pagamento / cartão aguardando captura
  processing: 'pending',
  created: 'pending',
}

export function summarizeOrder(mpOrder) {
  const payment = mpOrder?.transactions?.payments?.[0] || {}
  const rawStatus = String(mpOrder?.status || payment.status || '').toLowerCase()
  const status = ORDER_STATUS_MAP[rawStatus] || 'pending'
  const method = payment.payment_method || {}

  return {
    id: mpOrder?.id,
    paymentId: payment.id || null,
    status,
    rawStatus,
    statusDetail: payment.status_detail || mpOrder?.status_detail || null,
    paymentMethodId: method.id || null,
    paymentType: method.type || null,
    externalReference: mpOrder?.external_reference || null,
    totalPaidAmount: mpOrder?.total_paid_amount || null,
    // Só preenchido no Pix — o site mostra o QR code e o "copia e cola".
    pix:
      method.id === 'pix' && (method.qr_code || method.qr_code_base64)
        ? {
            qrCode: method.qr_code || null,
            qrCodeBase64: method.qr_code_base64 || null,
            ticketUrl: method.ticket_url || null,
            expiresAt: payment.date_of_expiration || payment.expiration_time || null,
          }
        : null,
  }
}

// Valida a assinatura x-signature que o Mercado Pago manda no
// webhook, quando um "webhookSecret" foi configurado. Se não foi
// configurado ainda, deixa passar (a própria criação do pagamento já
// exige as chaves corretas — o webhook só antecipa a confirmação; sem
// ele, a consulta manual de status no admin ainda funciona).
//
// O manifest é "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com
// HMAC-SHA256 (hex) usando a chave secreta. A doc do MP diz pra usar
// o data.id em minúsculas quando for alfanumérico (os ids de order
// "ORD..." são) — mas o validador oficial do SDK usa como veio. Pra
// não ficar refém de qual dos dois está certo, aceita os dois.
export function verifyWebhookSignature(req) {
  const settings = store.settings.get()
  const secret = settings.mercadopago.webhookSecret
  if (!secret) return true

  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']
  const dataId = req.query['data.id'] || req.query.data_id || req.body?.data?.id
  if (!xSignature || !dataId) return false

  const candidates = [String(dataId), String(dataId).toLowerCase()]
  for (const candidate of new Set(candidates)) {
    try {
      WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId: candidate, secret })
      return true
    } catch {
      // tenta a próxima variante
    }
  }
  return false
}
