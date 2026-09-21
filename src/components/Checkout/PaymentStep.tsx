import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Loader2, MessageCircle, ShieldAlert } from 'lucide-react'
import { apiPost, ApiError } from '../../lib/api'
import type { OrderResult, PaymentInfo } from './types'

const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opts?: { locale?: string }) => {
      bricks: () => {
        create: (type: string, containerId: string, settings: Record<string, unknown>) => Promise<unknown>
      }
    }
  }
}

let mpScriptPromise: Promise<void> | null = null

// Carrega o SDK do Mercado Pago uma única vez, mesmo se o componente
// remontar (ex.: cliente vai e volta entre as etapas do checkout).
function loadMercadoPagoScript(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()
  if (mpScriptPromise) return mpScriptPromise
  mpScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => resolve()
    script.onerror = () => {
      mpScriptPromise = null
      reject(new Error('Não foi possível carregar o Mercado Pago. Confira sua conexão e tente de novo.'))
    }
    document.head.appendChild(script)
  })
  return mpScriptPromise
}

const BRICK_CONTAINER_ID = 'karla-angel-payment-brick'

export function PaymentStep({
  order,
  paymentInfo,
  whatsappFallbackUrl,
  onBack,
  onResult,
}: {
  order: OrderResult
  paymentInfo: PaymentInfo
  whatsappFallbackUrl: string
  onBack: () => void
  onResult: (status: string, statusDetail: string | null) => void
}) {
  const [brickReady, setBrickReady] = useState(false)
  const [error, setError] = useState('')
  const controllerRef = useRef<{ unmount?: () => void } | null>(null)

  useEffect(() => {
    if (!paymentInfo.configured) return
    let cancelled = false

    loadMercadoPagoScript()
      .then(() => {
        if (cancelled || !window.MercadoPago) return
        const mp = new window.MercadoPago(paymentInfo.publicKey, { locale: 'pt-BR' })
        return mp.bricks().create('payment', BRICK_CONTAINER_ID, {
          initialization: {
            amount: order.totalCents / 100,
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              bankTransfer: 'all', // Pix entra nessa categoria no Payment Brick
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setBrickReady(true)
            },
            onError: (brickError: unknown) => {
              console.error('Erro no Payment Brick:', brickError)
              if (!cancelled) setError('O formulário de pagamento teve um problema. Recarregue a página e tente de novo.')
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
              new Promise<void>((resolve, reject) => {
                apiPost<{ status: string; statusDetail: string | null; order: OrderResult }>(`/api/orders/${order.id}/pay`, formData)
                  .then((res) => {
                    onResult(res.status, res.statusDetail)
                    resolve()
                  })
                  .catch((err) => {
                    setError(err instanceof ApiError ? err.message : 'Não foi possível processar o pagamento.')
                    reject(err)
                  })
              }),
          },
        })
      })
      .then((controller) => {
        if (!cancelled) controllerRef.current = controller as { unmount?: () => void }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      controllerRef.current?.unmount?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentInfo.configured, paymentInfo.publicKey, order.id])

  if (!paymentInfo.configured) {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-ink/50 hover:text-ink">
          <ChevronLeft size={15} /> Voltar
        </button>

        <div className="rounded-sm border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Pagamento pelo site indisponível no momento</p>
              <p className="mt-1 text-[13px] opacity-80">
                Seu pedido <strong>{order.number}</strong> ({formatBRL(order.totalCents)}) já está registrado. Finalize
                direto com a gente pelo WhatsApp — é rápido.
              </p>
            </div>
          </div>
        </div>

        <a
          href={whatsappFallbackUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-rose py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep"
        >
          <MessageCircle size={16} /> Finalizar no WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-ink/50 hover:text-ink">
        <ChevronLeft size={15} /> Voltar
      </button>

      <div className="flex items-center justify-between rounded-sm bg-ivory-dim px-4 py-3">
        <span className="text-[13px] text-ink/60">Total a pagar</span>
        <span className="text-[18px] font-semibold text-gold-deep">{formatBRL(order.totalCents)}</span>
      </div>

      {!brickReady && !error && (
        <div className="flex items-center justify-center gap-2 py-10 text-ink/45">
          <Loader2 size={18} className="animate-spin" /> Carregando formulário de pagamento…
        </div>
      )}

      {error && <p className="text-[13px] text-garnet">{error}</p>}

      <div id={BRICK_CONTAINER_ID} />
    </div>
  )
}
