import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useSiteData } from '../../context/SiteDataContext'
import { buildWhatsappUrl } from '../../data/site'
import { apiGet } from '../../lib/api'
import { InfoStep } from './InfoStep'
import { ReviewStep } from './ReviewStep'
import { PaymentStep } from './PaymentStep'
import { ConfirmationStep } from './ConfirmationStep'
import { EMPTY_ADDRESS, EMPTY_CUSTOMER, type AddressInfo, type CustomerInfo, type OrderResult, type PaymentInfo } from './types'

type Step = 'info' | 'review' | 'payment' | 'confirmation'

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, clear } = useCart()
  const { content } = useSiteData()

  const [step, setStep] = useState<Step>('info')
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER)
  const [address, setAddress] = useState<AddressInfo>(EMPTY_ADDRESS)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [order, setOrder] = useState<OrderResult | null>(null)
  const [finalStatus, setFinalStatus] = useState<string>('pending')

  // Busca a info de pagamento (chave pública + se está configurado) só
  // quando o checkout abre de verdade — sem chamada desnecessária toda
  // vez que o carrinho muda.
  useEffect(() => {
    if (!open) return
    apiGet<PaymentInfo>('/api/orders/config/payment-info').then((data) => {
      if (data) setPaymentInfo(data)
    })
  }, [open])

  // Reseta o fluxo quando o modal fecha, pra próxima compra começar do zero.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep('info')
        setOrder(null)
        setFinalStatus('pending')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  function handlePaymentResult(status: string) {
    setFinalStatus(status)
    setStep('confirmation')
    if (status === 'approved') clear()
  }

  const whatsappUrl = buildWhatsappUrl(
    content,
    order
      ? `Olá! Meu pedido ${order.number} (${(order.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) precisa de ajuda pra finalizar o pagamento.`
      : undefined
  )

  const stepLabel = { info: 'Seus dados', review: 'Revisão', payment: 'Pagamento', confirmation: 'Pronto' }[step]
  const stepIndex = { info: 0, review: 1, payment: 2, confirmation: 3 }[step]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/55 p-4 py-8 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg rounded-sm bg-ivory shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-taupe/60 px-6 py-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-taupe-deep">
                  Etapa {stepIndex + 1} de 4
                </p>
                <h2 className="font-display text-xl text-ink">{stepLabel}</h2>
              </div>
              <button onClick={onClose} aria-label="Fechar checkout" className="text-ink/40 hover:text-ink">
                <X size={22} />
              </button>
            </div>

            {/* barra de progresso simples */}
            <div className="flex h-[3px] w-full bg-taupe/40">
              <div className="h-full bg-rose transition-all duration-500" style={{ width: `${((stepIndex + 1) / 4) * 100}%` }} />
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {step === 'info' && (
                <InfoStep
                  customer={customer}
                  address={address}
                  onCustomerChange={(patch) => setCustomer((prev) => ({ ...prev, ...patch }))}
                  onAddressChange={(patch) => setAddress((prev) => ({ ...prev, ...patch }))}
                  onContinue={() => setStep('review')}
                />
              )}

              {step === 'review' &&
                (paymentInfo ? (
                  <ReviewStep
                    items={items}
                    customer={customer}
                    address={address}
                    paymentInfo={paymentInfo}
                    onBack={() => setStep('info')}
                    onOrderCreated={(o) => {
                      setOrder(o)
                      setStep('payment')
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center gap-2 py-10 text-ink/45">
                    <Loader2 size={18} className="animate-spin" /> Carregando…
                  </div>
                ))}

              {step === 'payment' && order && paymentInfo && (
                <PaymentStep
                  order={order}
                  paymentInfo={paymentInfo}
                  whatsappFallbackUrl={whatsappUrl}
                  onBack={() => setStep('review')}
                  onResult={handlePaymentResult}
                />
              )}

              {step === 'confirmation' && order && (
                <ConfirmationStep order={order} status={finalStatus} whatsappUrl={whatsappUrl} onClose={onClose} />
              )}
            </div>

            {subtotal === 0 && step !== 'confirmation' && (
              <p className="border-t border-taupe/60 px-6 py-4 text-center text-[13px] text-ink/50">Sua sacola está vazia.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
