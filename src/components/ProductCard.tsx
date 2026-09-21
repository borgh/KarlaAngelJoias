import { Images, ShoppingBag, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { JewelGlyph } from './JewelGlyph'
import { Sparkles, Shimmer } from './Sparkles'
import { getStockLabel } from '../lib/stockLabel'
import { useCart } from '../context/CartContext'
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
  const stock = getStockLabel(product)
  const { addItem } = useCart()

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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-sm border border-taupe/60 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-rose hover:shadow-[0_16px_40px_-18px_rgba(74,64,60,0.35)] lg:p-5"
    >
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-rose px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white lg:left-4 lg:top-4">
          {product.badge}
        </span>
      )}
      <div className="relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-ivory-dim">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              stock.tone === 'out' ? 'grayscale' : ''
            }`}
          />
        ) : (
          <JewelGlyph
            type={product.glyph}
            className="h-24 w-24 text-gold transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {/* Brilho passando — timing aleatório por produto, flasheia com
            menos frequência e intercalado com as estrelas. */}
        <Shimmer seed={product.id} />
        <Sparkles seed={product.id} count={4} />
        {product.images.length > 1 && (
          <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-ink backdrop-blur-sm">
            <Images size={11} /> {product.images.length}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-[11px] font-semibold uppercase tracking-[0.16em] text-white opacity-0 transition-all duration-300 group-hover:bg-ink/35 group-hover:opacity-100 group-hover:backdrop-blur-[1px]">
          Ver detalhes
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-taupe-deep">{product.categoryName}</p>
      <h3 className="mt-1 font-display text-[17px] tracking-[0.02em] text-ink">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-gold-deep sm:text-[15px]">{formatBRL(product.price)}</p>
        <p
          className={`shrink-0 whitespace-nowrap text-[10px] font-semibold sm:text-[11px] ${
            stock.tone === 'out' ? 'text-ink/40' : stock.tone === 'low' ? 'text-garnet' : 'text-ink/45'
          }`}
        >
          {stock.text}
        </p>
      </div>
      {stock.tone === 'out' ? (
        <button
          disabled
          onClick={(e) => e.stopPropagation()}
          className="mt-4 cursor-not-allowed rounded-full border border-taupe/60 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35"
        >
          Esgotado
        </button>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              addItem(product)
            }}
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-ivory transition-colors hover:bg-rose sm:text-[11px] sm:tracking-[0.12em]"
          >
            <ShoppingBag size={13} strokeWidth={2} />
            <span className="sm:hidden">Sacola</span>
            <span className="hidden sm:inline">Adicionar à sacola</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Comprar pelo WhatsApp"
            className="flex aspect-square shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-rose hover:bg-rose hover:text-white"
          >
            <MessageCircle size={16} strokeWidth={1.8} />
          </a>
        </div>
      )}
    </motion.div>
  )
}
