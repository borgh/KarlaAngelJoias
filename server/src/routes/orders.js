import { Router } from 'express'
import { nanoid } from 'nanoid'
import { store, nowIso } from '../db/store.js'
import { requireAuth, requirePermission } from '../auth.js'
import { checkAndNotifyLowStock, sendEmailAlert, sendWhatsAppAlert } from '../services/notify.js'
import { createPayment, getPayment, verifyWebhookSignature, isPaymentConfigured, getPublicPaymentInfo } from '../services/mercadopago.js'

export const ordersRouter = Router()

const ORDER_STATUSES = [
  'pending_payment', // pedido criado, aguardando confirmação do pagamento
  'paid', // pagamento aprovado
  'shipped', // enviado (admin marcou, com código de rastreio opcional)
  'delivered', // entregue (admin marcou)
  'cancelled', // cancelado antes de pagar (ou manualmente pelo admin)
  'rejected', // pagamento recusado pelo Mercado Pago
]

function genOrderNumber() {
  // Curto e fácil de falar por telefone/WhatsApp — não precisa ser
  // sequencial (nanoid já garante unicidade o bastante pro volume de
  // uma loja como essa).
  return 'KA' + nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
}

function shippingCostCents(subtotalCents) {
  const { flatRateCents, freeAboveCents } = store.settings.get().shipping
  if (freeAboveCents > 0 && subtotalCents >= freeAboveCents) return 0
  return flatRateCents
}

// Só os campos que o próprio cliente (dono do número do pedido) tem
// razão de ver — nunca a lista de pedidos de outra pessoa nem campos
// internos de operação.
function serializePublicOrder(order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    items: order.items.map((i) => ({ name: i.name, image: i.image, quantity: i.quantity, priceCents: i.priceCents })),
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    customerName: order.customer.name,
    createdAt: order.createdAt,
    paymentStatusDetail: order.paymentStatusDetail,
  }
}

function serializeAdminOrder(order) {
  return order
}

// -----------------------------------------------------------------
// Criação do pedido — SEMPRE recalcula preço e confere estoque a
// partir do banco. Nunca confia em preço/nome vindo do carrinho do
// cliente (poderia ser adulterado no navegador).
// -----------------------------------------------------------------
ordersRouter.post('/', async (req, res) => {
  const { items, customer, address } = req.body || {}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' })
  }
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ error: 'Nome, e-mail e telefone são obrigatórios.' })
  }
  if (!address?.cep || !address?.street || !address?.number || !address?.city || !address?.state) {
    return res.status(400).json({ error: 'Endereço de entrega incompleto.' })
  }

  const resolvedItems = []
  for (const reqItem of items) {
    const quantity = Number(reqItem.quantity) || 0
    if (quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: 'Quantidade inválida.' })
    }
    const product = store.products.find((p) => p.id === reqItem.productId)
    if (!product || !product.isActive) {
      return res.status(400).json({ error: `Produto não encontrado ou indisponível (${reqItem.productId}).` })
    }
    if (product.stockQuantity < quantity) {
      return res.status(409).json({
        error: `"${product.name}" não tem estoque suficiente (disponível: ${product.stockQuantity}).`,
        productId: product.id,
      })
    }
    resolvedItems.push({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || product.imageUrl || '',
      priceCents: Math.round(product.price * 100), // preço vem do banco, nunca do request
      quantity,
    })
  }

  const subtotalCents = resolvedItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
  const shippingCents = shippingCostCents(subtotalCents)
  const totalCents = subtotalCents + shippingCents
  const now = nowIso()

  const order = store.orders.insert({
    id: nanoid(),
    number: genOrderNumber(),
    status: 'pending_payment',
    items: resolvedItems,
    subtotalCents,
    shippingCents,
    totalCents,
    customer: {
      name: String(customer.name).slice(0, 200),
      email: String(customer.email).slice(0, 200),
      phone: String(customer.phone).slice(0, 40),
      document: String(customer.document || '').slice(0, 20),
    },
    address: {
      cep: String(address.cep).slice(0, 12),
      street: String(address.street).slice(0, 200),
      number: String(address.number).slice(0, 20),
      complement: String(address.complement || '').slice(0, 100),
      neighborhood: String(address.neighborhood || '').slice(0, 100),
      city: String(address.city).slice(0, 100),
      state: String(address.state).slice(0, 2).toUpperCase(),
    },
    mpPaymentId: null,
    paymentMethod: null,
    paymentStatusDetail: null,
    trackingCode: null,
    notes: '',
    createdAt: now,
    updatedAt: now,
    paidAt: null,
    shippedAt: null,
  })

  res.status(201).json({ order: serializePublicOrder(order), paymentConfigured: isPaymentConfigured() })
})

// -----------------------------------------------------------------
// Pagamento — recebe o token já gerado pelo Payment Brick no
// navegador (nunca o número do cartão em si) e cria a cobrança de
// verdade no Mercado Pago.
// -----------------------------------------------------------------
ordersRouter.post('/:id/pay', async (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' })
  if (order.status !== 'pending_payment') {
    return res.status(409).json({ error: 'Este pedido já foi processado.' })
  }

  try {
    const result = await createPayment({ order, brickData: req.body || {}, idempotencyKey: order.id })
    const approved = result.status === 'approved'
    const updated = store.orders.update(order.id, {
      mpPaymentId: String(result.id),
      paymentMethod: result.payment_method_id,
      paymentStatusDetail: result.status_detail,
      status: approved ? 'paid' : result.status === 'rejected' ? 'rejected' : 'pending_payment',
      paidAt: approved ? nowIso() : null,
      updatedAt: nowIso(),
    })

    if (approved) {
      await settleStockAndNotify(updated)
    }

    res.json({ status: result.status, statusDetail: result.status_detail, order: serializePublicOrder(updated) })
  } catch (err) {
    console.error('Erro ao criar pagamento no Mercado Pago:', err.message)
    res.status(502).json({ error: err.message || 'Falha ao processar o pagamento.' })
  }
})

// -----------------------------------------------------------------
// Webhook do Mercado Pago — a notificação em si só avisa "algo
// mudou"; a gente SEMPRE busca o pagamento de novo na API do MP
// (nunca confia em valores que vêm no corpo do webhook) antes de
// atualizar o pedido. Idempotente: se já estava pago, não reprocessa.
// -----------------------------------------------------------------
ordersRouter.post('/webhook/mercadopago', async (req, res) => {
  // Responde 200 rápido pro MP não ficar reenviando, mesmo que a
  // assinatura falhe — só não processa nada nesse caso.
  if (!verifyWebhookSignature(req)) {
    console.warn('Webhook do Mercado Pago com assinatura inválida — ignorado.')
    return res.sendStatus(200)
  }

  const paymentId = req.query['data.id'] || req.body?.data?.id
  const type = req.query.type || req.body?.type
  if (type !== 'payment' || !paymentId) return res.sendStatus(200)

  try {
    const payment = await getPayment(paymentId)
    const orderId = payment.external_reference
    const order = orderId && store.orders.find((o) => o.id === orderId)
    if (!order) return res.sendStatus(200)

    const alreadySettled = order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered'
    const approved = payment.status === 'approved'

    const updated = store.orders.update(order.id, {
      mpPaymentId: String(payment.id),
      paymentMethod: payment.payment_method_id,
      paymentStatusDetail: payment.status_detail,
      status: approved ? 'paid' : payment.status === 'rejected' ? 'rejected' : order.status,
      paidAt: approved ? order.paidAt || nowIso() : order.paidAt,
      updatedAt: nowIso(),
    })

    if (approved && !alreadySettled) {
      await settleStockAndNotify(updated)
    }
  } catch (err) {
    console.error('Erro processando webhook do Mercado Pago:', err.message)
  }
  res.sendStatus(200)
})

// Debita o estoque e reaproveita o mesmo alerta de estoque baixo já
// usado no resto do sistema — dispara só uma vez por pedido (chamado
// tanto pelo /pay quanto pelo webhook, mas nunca os dois pro mesmo
// pedido, por causa do `alreadySettled`/status check).
async function settleStockAndNotify(order) {
  for (const item of order.items) {
    const product = store.products.find((p) => p.id === item.productId)
    if (!product) continue
    const nextQty = Math.max(0, product.stockQuantity - item.quantity)
    const updatedProduct = store.products.update(product.id, { stockQuantity: nextQty })
    await checkAndNotifyLowStock(updatedProduct).catch((err) => console.error('Falha ao checar estoque baixo:', err.message))
  }

  const subject = `Novo pedido pago: ${order.number}`
  const itemsHtml = order.items.map((i) => `<li>${i.quantity}x ${i.name}</li>`).join('')
  const html = `<p>Pedido <strong>${order.number}</strong> de ${order.customer.name} — total R$ ${(order.totalCents / 100).toFixed(2)}</p><ul>${itemsHtml}</ul>`
  sendEmailAlert(subject, html).catch((err) => console.error('Falha ao enviar e-mail de novo pedido:', err.message))
  sendWhatsAppAlert(`🛍️ *Novo pedido pago!*\n\n*${order.number}* — ${order.customer.name}\nTotal: R$ ${(order.totalCents / 100).toFixed(2)}`).catch(
    (err) => console.error('Falha ao enviar WhatsApp de novo pedido:', err.message)
  )
}

// -----------------------------------------------------------------
// Info pública de pagamento — o checkout do site chama isso ANTES de
// mostrar o formulário, pra saber se dá pra cobrar (chave configurada)
// e pegar a chave pública que inicializa o Payment Brick no navegador.
// Nunca inclui a chave de acesso (secreta).
// -----------------------------------------------------------------
ordersRouter.get('/config/payment-info', (req, res) => {
  res.json(getPublicPaymentInfo())
})

// -----------------------------------------------------------------
// Consulta pública (tela de confirmação do próprio cliente)
// -----------------------------------------------------------------
ordersRouter.get('/:id', (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' })
  res.json({ order: serializePublicOrder(order) })
})

// -----------------------------------------------------------------
// Admin — listagem, detalhe e gestão de status
// -----------------------------------------------------------------
ordersRouter.get('/admin/list', requireAuth, (req, res) => {
  const { status, search } = req.query
  let all = store.orders.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (status && status !== 'all') all = all.filter((o) => o.status === status)
  if (search) {
    const q = String(search).toLowerCase()
    all = all.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    )
  }
  res.json({ orders: all.map(serializeAdminOrder), statuses: ORDER_STATUSES })
})

ordersRouter.get('/admin/:id', requireAuth, (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' })
  res.json({ order: serializeAdminOrder(order) })
})

ordersRouter.patch('/admin/:id', requireAuth, requirePermission('canEdit'), (req, res) => {
  const existing = store.orders.find((o) => o.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Pedido não encontrado.' })

  const { status, trackingCode, notes } = req.body || {}
  const patch = { updatedAt: nowIso() }

  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' })
    patch.status = status
    if (status === 'shipped' && !existing.shippedAt) patch.shippedAt = nowIso()
  }
  if (trackingCode !== undefined) patch.trackingCode = String(trackingCode).slice(0, 100)
  if (notes !== undefined) patch.notes = String(notes).slice(0, 2000)

  const updated = store.orders.update(existing.id, patch)
  res.json({ order: serializeAdminOrder(updated) })
})
