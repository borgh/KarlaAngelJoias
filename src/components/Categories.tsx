import { motion } from 'framer-motion'
import { useSiteData } from '../context/SiteDataContext'
import { JewelGlyph } from './JewelGlyph'
import { LINES, lineHref } from '../lib/lines'

export function Categories() {
  const { categories } = useSiteData()
  return (
    <section id="colecoes" className="bg-ivory px-6 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Linhas da marca — 4 blocos grandes, como os "departamentos" do H.Stern */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-rose-deep">Nossas linhas</p>
          <h2 className="font-display text-3xl font-light tracking-[0.04em] text-ink lg:text-4xl">
            Escolha o seu brilho
          </h2>
        </div>
        <div className="mb-20 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {LINES.map((l, i) => (
            <motion.a
              key={l.id}
              href={lineHref(l.id)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.07 }}
              className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-sm p-6 lg:p-8 ${
                i % 2 === 0 ? 'bg-rose' : 'bg-taupe'
              }`}
            >
              <span className="absolute inset-3 rounded-sm border border-white/50 transition-all duration-500 group-hover:inset-2" />
              <span className="font-script absolute right-6 top-5 text-2xl text-white/70 lg:text-3xl">easy chic</span>
              <h3 className="relative font-display text-2xl font-light uppercase tracking-[0.16em] text-white lg:text-3xl">
                {l.label}
              </h3>
              <p className="relative mt-1 text-[12px] text-white/85">{l.tagline}</p>
              <span className="relative mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-white underline decoration-white/50 underline-offset-4 transition-all group-hover:decoration-white">
                Ver peças
              </span>
            </motion.a>
          ))}
        </div>

        {/* Categorias por tipo de peça */}
        <div className="mb-10 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-rose-deep">Coleções</p>
            <h2 className="font-display text-3xl font-light tracking-[0.04em] text-ink lg:text-4xl">Por tipo de peça</h2>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-ink/60">
            Peças desenhadas para se sobrepor sem competir — monte suas combinações.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {categories.map((c, i) => (
            <motion.a
              key={c.id}
              href="#catalogo"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group flex flex-col items-center rounded-sm border border-taupe/70 bg-white/60 px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-rose hover:shadow-[0_12px_30px_-12px_rgba(185,141,138,0.45)]"
            >
              <JewelGlyph type={c.glyph} className="h-14 w-14 text-gold transition-transform duration-500 group-hover:scale-110" />
              <h3 className="mt-5 font-display text-lg tracking-[0.08em] text-ink">{c.name}</h3>
              <p className="mt-1 text-[12px] text-ink/55">{c.description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
