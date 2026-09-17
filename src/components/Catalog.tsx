import { useEffect, useMemo, useState } from 'react'
import { ProductCard } from './ProductCard'
import { ProductModal } from './ProductModal'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'
import { CATALOG_HASH_PREFIX, LINES, lineFromHash, lineHref, type ProductLine } from '../lib/lines'
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
  const [activeLine, setActiveLine] = useState<ProductLine | null>(null)

  // O menu (Semijoia · Joias · Moissanite · Noiva) navega pra
  // "#catalogo/<linha>". Esse hash não corresponde a nenhum elemento,
  // então o navegador não rola sozinho — a gente lê a linha do hash,
  // aplica o filtro e rola até o catálogo manualmente. Funciona com
  // links comuns (<a href>), inclusive na gaveta do celular e ao abrir
  // a URL direto compartilhada.
  useEffect(() => {
    function applyHash() {
      const { hash } = window.location
      if (!hash.startsWith(CATALOG_HASH_PREFIX)) return
      setActiveLine(lineFromHash(hash))
      setActiveCategory('Todas')
      requestAnimationFrame(() => {
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const byLine = useMemo(
    () => (activeLine ? products.filter((p) => p.line === activeLine) : products),
    [products, activeLine]
  )

  const categoryNames = useMemo(() => {
    const present = new Set(byLine.map((p) => p.categoryName))
    return ['Todas', ...categories.map((c) => c.name).filter((name) => present.has(name))]
  }, [byLine, categories])

  const filtered =
    activeCategory === 'Todas' ? byLine : byLine.filter((p) => p.categoryName === activeCategory)

  const lineLabel = activeLine ? LINES.find((l) => l.id === activeLine)?.label : null

  return (
    <section id="catalogo" className="scroll-mt-28 bg-ivory-dim px-6 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-rose-deep">
              {lineLabel ? `Linha ${lineLabel}` : content['catalog.eyebrow']}
            </p>
            <h2 className="font-display text-3xl font-light tracking-[0.04em] leading-tight text-ink lg:text-4xl">
              {lineLabel ?? content['catalog.title']}
            </h2>
          </div>
        </div>

        {/* Filtro por linha (o mesmo eixo do menu) */}
        <div className="mb-4 flex flex-wrap gap-2">
          <a
            href={CATALOG_HASH_PREFIX}
            onClick={() => setActiveLine(null)}
            className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              activeLine === null ? 'border-rose bg-rose text-white' : 'border-taupe text-ink/65 hover:border-rose-deep hover:text-rose-deep'
            }`}
          >
            {content['catalog.all_lines']}
          </a>
          {LINES.map((l) => (
            <a
              key={l.id}
              href={lineHref(l.id)}
              className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                activeLine === l.id ? 'border-rose bg-rose text-white' : 'border-taupe text-ink/65 hover:border-rose-deep hover:text-rose-deep'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Filtro por tipo de peça */}
        {categoryNames.length > 2 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === name ? 'bg-ink text-ivory' : 'bg-white/70 text-ink/60 hover:bg-white hover:text-ink'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-taupe/70 bg-white/50 py-16 text-center">
            <p className="text-ink/60">
              {lineLabel
                ? `Ainda não há peças cadastradas na linha ${lineLabel}.`
                : 'Nenhuma peça nessa categoria no momento.'}
            </p>
            <a
              href={CATALOG_HASH_PREFIX}
              onClick={() => setActiveLine(null)}
              className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep underline underline-offset-4"
            >
              Ver todas as peças
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
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
