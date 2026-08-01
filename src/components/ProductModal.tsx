import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { JewelGlyph } from './JewelGlyph'
import { Sparkles } from './Sparkles'
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
  return (
    <AnimatePresence>
      {product && (
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
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-ink sm:aspect-auto">
              {product.badge && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {product.badge}
                </span>
              )}
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <JewelGlyph type={product.glyph} className="h-32 w-32 text-gold/80" />
              )}
              <div className="shimmer-bg animate-shimmer pointer-events-none absolute inset-0" />
              <Sparkles seed={product.id} count={7} />
            </div>

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
              <p className="mt-3 text-2xl text-gold">{formatBRL(product.price)}</p>

              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                {product.description?.trim()
                  ? product.description
                  : 'Peça em acabamento de joalheria — antialérgica e pensada para durar. Fale com a gente no WhatsApp para saber mais detalhes, disponibilidade e possibilidade de personalização.'}
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 rounded-full bg-gold py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-bright"
              >
                Comprar no WhatsApp
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
