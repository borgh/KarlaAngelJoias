import { useState } from 'react'
import { motion } from 'framer-motion'
import { JewelGlyph } from './JewelGlyph'
import { ProductModal } from './ProductModal'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'
import type { ProductView } from '../lib/viewTypes'

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function BestSellers() {
  const { products: allProducts, content } = useSiteData()
  // Se nenhum produto foi marcado como "mais vendido" ainda no admin,
  // mostra o catálogo geral em vez de deixar a seção vazia.
  const bestsellers = allProducts.filter((p) => p.isBestseller)
  const products = bestsellers.length > 0 ? bestsellers : allProducts
  const [selected, setSelected] = useState<ProductView | null>(null)

  return (
    <section id="mais-vendidos" className="bg-ink px-6 py-24 text-ivory lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.28em] text-gold">
              Mais vendidos
            </p>
            <h2 className="font-display text-4xl leading-tight lg:text-5xl">
              As peças favoritas
              <br className="hidden lg:block" /> de quem já usa Karla Angel.
            </h2>
          </div>
          <a
            href="#contato"
            className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory/70 underline decoration-gold/40 underline-offset-8 transition-colors hover:text-gold"
          >
            Ver catálogo completo
          </a>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((p, i) => {
            const link = buildWhatsappUrl(
              content,
              `Olá! Tenho interesse na peça "${p.name}" (${formatBRL(p.price)}) que vi no site. Ainda está disponível?`
            )
            return (
              <motion.div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(p)
                  }
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.07 }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-ink-soft/60 p-5 text-left transition-colors hover:border-gold/40"
              >
                {p.badge && (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                    {p.badge}
                  </span>
                )}
                <div className="relative mb-5 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-ink">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <>
                      <div className="shimmer-bg animate-shimmer absolute inset-0" />
                      <JewelGlyph
                        type={p.glyph}
                        className="h-24 w-24 text-gold/80 transition-transform duration-500 group-hover:scale-110"
                      />
                    </>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-[11px] font-semibold uppercase tracking-wide text-ivory opacity-0 backdrop-blur-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100 group-hover:backdrop-blur-[1px]">
                    Ver detalhes
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">{p.categoryName}</p>
                <h3 className="font-display text-lg text-ivory">{p.name}</h3>
                <p className="mt-1 text-gold">{formatBRL(p.price)}</p>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 rounded-full border border-ivory/20 py-2.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-ink"
                >
                  Comprar no WhatsApp
                </a>
              </motion.div>
            )
          })}
        </div>

        {products.every((p) => !p.imageUrl) && (
          <p className="mt-8 text-center text-[12px] text-ivory/35">
            Catálogo ilustrativo — fotos reais das peças em breve.
          </p>
        )}
      </div>

      <ProductModal
        product={selected}
        whatsappUrl={
          selected
            ? buildWhatsappUrl(
                content,
                `Olá! Tenho interesse na peça "${selected.name}" (${formatBRL(selected.price)}) que vi no site. Ainda está disponível?`
              )
            : ''
        }
        onClose={() => setSelected(null)}
      />
    </section>
  )
}
