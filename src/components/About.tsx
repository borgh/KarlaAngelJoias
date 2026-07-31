import { motion } from 'framer-motion'
import { useSiteData } from '../context/SiteDataContext'

export function About() {
  const { content } = useSiteData()
  return (
    <section id="historia" className="bg-ivory px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.28em] text-garnet">
            Nossa história
          </p>
          <h2 className="font-display text-4xl leading-tight text-ink lg:text-5xl">
            Joalheria pensada
            <br />
            para o dia a dia real.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-5 text-[15px] leading-relaxed text-ink/70"
        >
          <p>{content['about.paragraph1']}</p>
          <p>{content['about.paragraph2']}</p>
          <div className="grid grid-cols-3 gap-6 pt-4">
            {[
              [content['about.stat1_number'], content['about.stat1_label']],
              [content['about.stat2_number'], content['about.stat2_label']],
              [content['about.stat3_number'], content['about.stat3_label']],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl text-ink">{n}</p>
                <p className="text-[12px] text-ink/50">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
