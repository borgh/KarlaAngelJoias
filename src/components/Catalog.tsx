import { useMemo, useState } from 'react'
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

export function Catalog() {
  const { products, categories, content } = useSiteData()
  const [selected, setSelected] = useState<ProductView | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Todas')

  const categoryNames = useMemo(() => {
    const present = new Set(products.map((p) => p.categoryName))
    return ['Todas', ...categories.map((c) => c.name).filter((name) => present.has(name))]
  }, [products, categories])

  const filtered = activeCategory === 'Todas' ? products : products.filter((p) => p.categoryName === activeCategory)

  return (
    <section id="catalogo" className="bg-ivory px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.28em] text-garnet">
            Catálogo completo
          </p>
          <h2 className="font-display text-4xl leading-tight text-ink lg:text-5xl">
            Todas as peças, em um só lugar.
          </h2>
        </div>

        {categoryNames.length > 2 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                  activeCategory === name
                    ? 'border-ink bg-ink text-ivory'
                    : 'border-ink/15 text-ink/60 hover:border-ink/40'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-ink/40">Nenhuma peça nessa categoria no momento.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                whatsappUrl={whatsappFor(content, p)}
                onSelect={setSelected}
                delay={(i % 4) * 0.05}
              />
            ))}
          </div>
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
