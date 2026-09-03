import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { ProductModal } from './ProductModal'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'
import type { ProductView } from '../lib/viewTypes'

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function whatsappFor(content: Record<string, string>, p: ProductView) {
  return buildWhatsappUrl(
    content,
    `Olá! Tenho interesse na peça "${p.name}" (${formatBRL(p.price)}) que vi no site. Ainda está disponível?`
  )
}

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
            href="#catalogo"
            className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory/70 underline decoration-gold/40 underline-offset-8 transition-colors hover:text-gold"
          >
            Ver catálogo completo
          </a>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              whatsappUrl={whatsappFor(content, p)}
              onSelect={setSelected}
              delay={(i % 4) * 0.07}
            />
          ))}
        </div>

        {products.every((p) => p.images.length === 0) && (
          <p className="mt-8 text-center text-[12px] text-ivory/35">
            Catálogo ilustrativo — fotos reais das peças em breve.
          </p>
        )}
      </div>

      <ProductModal
        product={selected}
        whatsappUrl={selected ? whatsappFor(content, selected) : ''}
        onClose={() => setSelected(null)}
      />
    </section>
  )
}
