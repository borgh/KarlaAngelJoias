import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { items, isOpen, close, removeItem, updateQuantity, subtotal } = useCart()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-ivory shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-taupe/60 px-6 py-5">
              <h2 className="font-display text-xl text-ink">Sacola {items.length > 0 && `(${items.length})`}</h2>
              <button onClick={close} aria-label="Fechar sacola" className="text-ink/50 hover:text-ink">
                <X size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <ShoppingBag size={36} strokeWidth={1.2} className="text-taupe-deep" />
                <p className="text-[14px] text-ink/55">Sua sacola está vazia.</p>
                <button
                  onClick={close}
                  className="mt-1 rounded-full border border-ink/20 px-5 py-2 text-[12px] font-semibold uppercase tracking-wide text-ink hover:border-rose hover:text-rose-deep"
                >
                  Ver peças
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="divide-y divide-taupe/40">
                    {items.map((item) => (
                      <li key={item.productId} className="flex gap-3 py-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-ivory-dim">
                          {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <p className="font-display text-[15px] leading-tight text-ink">{item.name}</p>
                          <p className="mt-0.5 text-[13px] text-gold-deep">{formatBRL(item.price)}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 rounded-full border border-taupe/70">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                aria-label="Diminuir quantidade"
                                className="p-1.5 text-ink/60 hover:text-ink"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-4 text-center text-[13px] text-ink">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.stockQuantity}
                                aria-label="Aumentar quantidade"
                                className="p-1.5 text-ink/60 hover:text-ink disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.productId)}
                              aria-label={`Remover ${item.name}`}
                              className="text-ink/35 hover:text-garnet"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-taupe/60 px-6 py-5">
                  <div className="mb-4 flex items-center justify-between text-[15px]">
                    <span className="text-ink/60">Subtotal</span>
                    <span className="font-medium text-ink">{formatBRL(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-[12px] text-ink/45">Frete calculado na próxima etapa.</p>
                  <button
                    onClick={onCheckout}
                    className="w-full rounded-full bg-rose py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep"
                  >
                    Finalizar compra
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
