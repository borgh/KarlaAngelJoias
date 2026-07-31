import { motion } from 'framer-motion'
import { useSiteData } from '../context/SiteDataContext'
import { JewelGlyph } from './JewelGlyph'

export function Categories() {
  const { categories } = useSiteData()
  return (
    <section id="colecoes" className="bg-ivory px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 lg:mb-20 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.28em] text-garnet">
              Coleções
            </p>
            <h2 className="font-display text-4xl leading-tight text-ink lg:text-5xl">
              Cada peça, um jeito
              <br className="hidden lg:block" /> de contar quem você é.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink/60">
            Explore por categoria e monte combinações — nossas peças foram
            desenhadas para se sobrepor sem competir.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => (
            <motion.a
              key={c.id}
              href="#mais-vendidos"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden bg-ivory p-7 transition-colors hover:bg-ink"
            >
              <JewelGlyph
                type={c.glyph}
                className="h-16 w-16 text-ink/70 transition-colors duration-300 group-hover:text-gold"
              />
              <div>
                <h3 className="font-display text-2xl text-ink transition-colors duration-300 group-hover:text-ivory">
                  {c.name}
                </h3>
                <p className="mt-1 text-[13px] text-ink/50 transition-colors duration-300 group-hover:text-ivory/60">
                  {c.description}
                </p>
              </div>
              <span className="absolute right-6 top-6 text-2xl text-ink/20 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold">
                ↗
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
