import { motion } from 'framer-motion'
import { useSiteData } from '../context/SiteDataContext'

export function About() {
  const { content } = useSiteData()
  return (
    <section id="historia" className="scroll-mt-28 bg-ivory px-6 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Retrato da Karla — do brand book */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto mb-6 w-full max-w-md lg:mb-0 lg:max-w-none"
        >
          <div className="absolute -left-3 -top-3 h-full w-full rounded-sm border border-rose lg:-left-5 lg:-top-5" aria-hidden="true" />
          <img
            src={content['about.image'] || '/brand/karla.jpg'}
            alt="Karla, fundadora da Karla Angel"
            className="relative aspect-[4/5] w-full rounded-sm object-cover object-top"
            loading="lazy"
          />
          <span className="font-script absolute -bottom-4 right-4 text-4xl text-rose-deep lg:-bottom-6 lg:text-5xl">{content['about.signature']}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-rose-deep">{content['about.eyebrow']}</p>
          <h2 className="font-display text-3xl font-light tracking-[0.04em] leading-tight text-ink lg:text-4xl">
            <span className="whitespace-pre-line">{content['about.title']}</span>
          </h2>
          <p className="font-script mt-3 text-2xl text-taupe-deep">{content['about.tagline']}</p>
          <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-ink/70">
            <p>{content['about.paragraph1']}</p>
            <p>{content['about.paragraph2']}</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-taupe/60 pt-8">
            {[
              [content['about.stat1_number'], content['about.stat1_label']],
              [content['about.stat2_number'], content['about.stat2_label']],
              [content['about.stat3_number'], content['about.stat3_label']],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-light text-ink">{n}</p>
                <p className="mt-1 text-[12px] leading-snug text-ink/50">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
