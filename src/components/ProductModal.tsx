import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Ruler } from 'lucide-react'
import { ProductImageCarousel } from './ProductImageCarousel'
import { getStockLabel } from '../lib/stockLabel'
import { RingSizerModal } from './RingSizer/RingSizerModal'
import type { ProductView } from '../lib/viewTypes'

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ProductModal({
  product,
  whatsappUrl,
  onClose,
}: {
  product: ProductView | null
  whatsappUrl: string
  onClose: () => void
}) {
  const [ringSizerOpen, setRingSizerOpen] = useState(false)
  return (
    <AnimatePresence>
      {product && (() => {
        const stock = getStockLabel(product)
        return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[88vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-2xl bg-ivory shadow-2xl sm:grid-cols-2"
          >
            <ProductImageCarousel
              images={product.images}
              glyph={product.glyph}
              alt={product.name}
              seed={product.id}
              grayscale={stock.tone === 'out'}
              badge={product.badge}
            />

            <div className="relative flex flex-col p-7 sm:p-8">
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute right-5 top-5 text-ink/40 transition-colors hover:text-ink"
              >
                <X size={22} />
              </button>

              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-garnet">
                {product.categoryName}
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight text-ink">{product.name}</h2>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-2xl text-gold">{formatBRL(product.price)}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    stock.tone === 'out'
                      ? 'bg-ink/5 text-ink/40'
                      : stock.tone === 'low'
                        ? 'bg-garnet/10 text-garnet'
                        : 'bg-green-50 text-green-700'
                  }`}
                >
                  {stock.text}
                </span>
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                {product.description?.trim()
                  ? product.description
                  : 'Peça em acabamento de joalheria — antialérgica e pensada para durar. Fale com a gente no WhatsApp para saber mais detalhes, disponibilidade e possibilidade de personalização.'}
              </p>

              {stock.tone === 'out' ? (
                <button
                  disabled
                  className="mt-8 cursor-not-allowed rounded-full bg-ink/10 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-ink/40"
                >
                  Produto esgotado
                </button>
              ) : (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 rounded-full bg-gold py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-bright"
                >
                  Comprar no WhatsApp
                </a>
              )}

              {product.glyph === 'ring' && (
                <button
                  onClick={() => setRingSizerOpen(true)}
                  className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink/50 hover:text-garnet"
                >
                  <Ruler size={13} /> Não sabe seu tamanho? Descubra aqui
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
        )
      })()}

      <RingSizerModal open={ringSizerOpen} onClose={() => setRingSizerOpen(false)} />
    </AnimatePresence>
  )
}
