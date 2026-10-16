import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle, MessageCircle, Copy, Check, QrCode, RotateCcw } from 'lucide-react'
import { apiGet } from '../../lib/api'
import type { OrderResult, PixData } from './types'

const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Status do nosso pedido (servidor) → status "de tela" usado aqui.
function orderStatusToPayment(status: string): string | null {
  if (status === 'paid' || status === 'shipped' || status === 'delivered') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'cancelled') return 'cancelled'
  return null // pending_payment: continua esperando
}

export function ConfirmationStep({
  order,
  status,
  pix,
  whatsappUrl,
  onClose,
  onStatusChange,
  onRetry,
}: {
  order: OrderResult
  status: string
  pix: PixData | null
  whatsappUrl: string
  onClose: () => void
  onStatusChange?: (status: string) => void
  onRetry?: () => void
}) {
  const approved = status === 'approved'
  const rejected = status === 'rejected' || status === 'cancelled'
  const waitingPix = !approved && !rejected && !!pix
  // in_process, pending, e qualquer outro status do MP ficam como "em análise"

  // Pix: fica consultando o pedido a cada 5s até o webhook do MP marcar
  // como pago (ou o QR expirar). Para sozinho quando sai de "pending".
  useEffect(() => {
    if (!waitingPix) return
    let stopped = false
    const timer = setInterval(async () => {
      const data = await apiGet<{ order: OrderResult }>(`/api/orders/${order.id}`)
      if (stopped || !data?.order) return
      const next = orderStatusToPayment(data.order.status)
      if (next) onStatusChange?.(next)
    }, 5000)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [waitingPix, order.id, onStatusChange])

  return (
    <div className="flex flex-col items-center py-4 text-center">
      {approved && (
        <>
          <CheckCircle2 size={48} strokeWidth={1.3} className="mb-4 text-green-600" />
          <h3 className="font-display text-2xl text-ink">Pagamento aprovado!</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            Pedido <strong>{order.number}</strong> confirmado — {formatBRL(order.totalCents)}. Em breve a gente separa e
            envia sua peça. Você recebe atualizações por e-mail.
          </p>
        </>
      )}

      {rejected && (
        <>
          <XCircle size={48} strokeWidth={1.3} className="mb-4 text-garnet" />
          <h3 className="font-display text-2xl text-ink">{status === 'cancelled' ? 'Pagamento cancelado' : 'Pagamento recusado'}</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            Seu pedido <strong>{order.number}</strong> ficou registrado, mas o pagamento não passou. Tenta outro cartão
            ou Pix, ou finaliza direto com a gente pelo WhatsApp.
          </p>
        </>
      )}

      {waitingPix && (
        <>
          <QrCode size={44} strokeWidth={1.3} className="mb-3 text-gold" />
          <h3 className="font-display text-2xl text-ink">Pague com Pix</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            Pedido <strong>{order.number}</strong> — {formatBRL(order.totalCents)}. Escaneie o QR code no app do seu banco
            ou copie o código abaixo. Assim que o pagamento cair, esta tela confirma sozinha.
          </p>
          <PixPanel pix={pix} />
        </>
      )}

      {!approved && !rejected && !waitingPix && (
        <>
          <Clock size={48} strokeWidth={1.3} className="mb-4 text-gold" />
          <h3 className="font-display text-2xl text-ink">Pagamento em análise</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            Pedido <strong>{order.number}</strong> registrado — {formatBRL(order.totalCents)}. Assim que o Mercado Pago
            confirmar (alguns pagamentos levam um pouco mais), a gente já separa sua peça. Você recebe a confirmação por
            e-mail.
          </p>
        </>
      )}

      <div className="mt-7 flex w-full flex-col gap-2.5">
        {rejected && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory hover:bg-ink/85"
          >
            <RotateCcw size={15} /> Tentar outra forma de pagamento
          </button>
        )}
        {!approved && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-rose py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-rose-deep"
          >
            <MessageCircle size={15} /> Falar no WhatsApp
          </a>
        )}
        <button
          onClick={onClose}
          className="rounded-full border border-ink/20 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink hover:border-rose hover:text-rose-deep"
        >
          {approved ? 'Continuar comprando' : 'Fechar'}
        </button>
      </div>
    </div>
  )
}

function PixPanel({ pix }: { pix: PixData }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!pix.qrCode) return
    try {
      await navigator.clipboard.writeText(pix.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // navegadores antigos: o campo abaixo é selecionável, a cliente copia na mão
    }
  }

  const expires = pix.expiresAt ? new Date(pix.expiresAt) : null

  return (
    <div className="mt-5 w-full rounded-sm border border-taupe/60 bg-white p-4">
      {pix.qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR code do Pix"
          className="mx-auto h-48 w-48 rounded-sm"
        />
      )}

      {pix.qrCode && (
        <>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Pix copia e cola</p>
          <textarea
            readOnly
            value={pix.qrCode}
            onFocus={(e) => e.currentTarget.select()}
            rows={3}
            className="mt-1 w-full resize-none rounded-sm border border-ink/10 bg-ivory-dim px-2 py-1.5 font-mono text-[11px] text-ink/70 outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-gold-deep"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Código copiado!' : 'Copiar código Pix'}
          </button>
        </>
      )}

      {expires && !Number.isNaN(expires.getTime()) && (
        <p className="mt-3 text-[11px] text-ink/45">
          Válido até {expires.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      )}

      <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink/50">
        <Clock size={13} className="animate-pulse" /> Aguardando confirmação do pagamento…
      </p>
    </div>
  )
}
