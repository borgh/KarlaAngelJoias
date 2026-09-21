import { CheckCircle2, Clock, XCircle, MessageCircle } from 'lucide-react'
import type { OrderResult } from './types'

const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ConfirmationStep({
  order,
  status,
  whatsappUrl,
  onClose,
}: {
  order: OrderResult
  status: string
  whatsappUrl: string
  onClose: () => void
}) {
  const approved = status === 'approved'
  const rejected = status === 'rejected'
  // in_process, pending, e qualquer outro status do MP ficam como "em análise"

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
          <h3 className="font-display text-2xl text-ink">Pagamento recusado</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            Seu pedido <strong>{order.number}</strong> ficou registrado, mas o pagamento não passou. Tenta outro cartão,
            ou finaliza direto com a gente pelo WhatsApp.
          </p>
        </>
      )}

      {!approved && !rejected && (
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
