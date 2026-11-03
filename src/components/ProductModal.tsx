import { useState } from 'react'
import { useSiteData } from '../context/SiteDataContext'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Ruler, ShoppingBag, MessageCircle, Link2, Check } from 'lucide-react'
import { JewelGlyph } from './JewelGlyph'
import { ProductImageCarousel } from './ProductImageCarousel'
import { getStockLabel } from '../lib/stockLabel'
import { useCart } from '../context/CartContext'
import { RingSizerModal } from './RingSizer/RingSizerModal'
import { productLink } from '../context/ProductViewerContext'
import { getRelatedProducts } from '../lib/related'
import { useEffect, useRef } from 'react'
import type { ProductView } from '../lib/viewTypes'

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ProductModal({
  product,
  whatsappUrl,
  onClose,
  onSelectProduct,
}: {
  product: ProductView | null
  whatsappUrl: string
  onClose: () => void
  onSelectProduct: (p: ProductView) => void
}) {
  const [ringSizerOpen, setRingSizerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { content, products } = useSiteData()

  useEffect(() => {
    setCopied(false)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [product?.id])

  async function copyLink(id: string) {
    const link = productLink(id)
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  const { addItem } = useCart()
  return (
    <AnimatePresence>
      {product && (() => {
        const stock = getStockLabel(product)
        const related = getRelatedProducts(product, products)
        return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            ref={scrollRef}
            className="grid max-h-[88vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-sm bg-ivory shadow-2xl sm:grid-cols-2"
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
              <div className="absolute right-5 top-5 flex items-center gap-3">
                <button
                  onClick={() => copyLink(product.id)}
                  aria-label={content['product.copy_link'] || 'Copiar link do produto'}
                  title={content['product.copy_link'] || 'Copiar link do produto'}
                  className="flex items-center gap-1 text-ink/40 transition-colors hover:text-rose-deep"
                >
                  {copied ? <Check size={18} /> : <Link2 size={18} />}
                  {copied && (
                    <span className="text-[11px] font-medium" role="status">
                      {content['product.link_copied'] || 'Link copiado!'}
                    </span>
                  )}
                </button>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="text-ink/40 transition-colors hover:text-ink"
                >
                  <X size={22} />
                </button>
              </div>

              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-rose-deep">
                {product.categoryName}
              </p>
              <h2 className="mt-2 font-display text-3xl font-light tracking-[0.02em] leading-tight text-ink">{product.name}</h2>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-2xl font-medium text-gold-deep">{formatBRL(product.price)}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    stock.tone === 'out'
                      ? 'bg-ink/5 text-ink/40'
                      : stock.tone === 'low'
                        ? 'bg-garnet/15 text-garnet'
                        : 'bg-taupe/40 text-ink/70'
                  }`}
                >
                  {stock.text}
                </span>
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                {product.description?.trim()
                  ? product.description
                  : content['product.default_description']}
              </p>

              {stock.tone === 'out' ? (
                <button
                  disabled
                  className="mt-8 cursor-not-allowed rounded-full bg-ink/10 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-ink/40"
                >
                  Produto esgotado
                </button>
              ) : (
                <div className="mt-8 space-y-2.5">
                  <button
                    onClick={() => {
                      addItem(product)
                      onClose()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-rose"
                  >
                    <ShoppingBag size={16} /> Adicionar à sacola
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-rose hover:bg-rose hover:text-white"
                  >
                    <MessageCircle size={15} /> {content['product.buy_label']}
                  </a>
                </div>
              )}

              {product.glyph === 'ring' && (
                <button
                  onClick={() => setRingSizerOpen(true)}
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50 hover:text-rose-deep"
                >
                  <Ruler size={13} /> Não sabe seu tamanho? Descubra aqui
                </button>
              )}
            </div>

            {related.length > 0 && (
              <div className="border-t border-taupe/60 p-7 sm:col-span-2 sm:p-8">
                <h3 className="mb-4 font-display text-xl font-light tracking-[0.03em] text-ink">
                  {content['product.related_title'] || 'Você também vai gostar'}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelectProduct(r)}
                      className="group w-36 shrink-0 text-left sm:w-40"
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-ivory-dim">
                        {r.images[0] ? (
                          <img
                            src={r.images[0]}
                            alt={r.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <JewelGlyph type={r.glyph} className="h-12 w-12 text-gold" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-ink">{r.name}</p>
                      <p className="text-[13px] font-medium text-gold-deep">{formatBRL(r.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
        )
      })()}

      <RingSizerModal open={ringSizerOpen} onClose={() => setRingSizerOpen(false)} />
    </AnimatePresence>
  )
}
