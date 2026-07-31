import { motion } from 'framer-motion'
import { JewelGlyph } from './JewelGlyph'
import type { ProductView } from '../lib/viewTypes'

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ProductCard({
  product,
  whatsappUrl,
  onSelect,
  delay = 0,
}: {
  product: ProductView
  whatsappUrl: string
  onSelect: (p: ProductView) => void
  delay?: number
}) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(product)
        }
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-ink-soft/60 p-5 text-left transition-colors hover:border-gold/40"
    >
      {product.badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
          {product.badge}
        </span>
      )}
      <div className="relative mb-5 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-ink">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <>
            <div className="shimmer-bg animate-shimmer absolute inset-0" />
            <JewelGlyph
              type={product.glyph}
              className="h-24 w-24 text-gold/80 transition-transform duration-500 group-hover:scale-110"
            />
          </>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-[11px] font-semibold uppercase tracking-wide text-ivory opacity-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100 group-hover:backdrop-blur-[1px]">
          Ver detalhes
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">{product.categoryName}</p>
      <h3 className="font-display text-lg text-ivory">{product.name}</h3>
      <p className="mt-1 text-gold">{formatBRL(product.price)}</p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-4 rounded-full border border-ivory/20 py-2.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-ink"
      >
        Comprar no WhatsApp
      </a>
    </motion.div>
  )
}
