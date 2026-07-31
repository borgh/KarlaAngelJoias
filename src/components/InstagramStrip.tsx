import { InstagramIcon } from './icons/InstagramIcon'
import { motion } from 'framer-motion'
import { JewelGlyph } from './JewelGlyph'
import { useSiteData } from '../context/SiteDataContext'

const FALLBACK_GLYPHS = ['ring', 'necklace', 'earring', 'bracelet', 'ring', 'necklace'] as const

export function InstagramStrip() {
  const { content, instagramItems } = useSiteData()
  const instagramUrl = content['contact.instagram_url']
  const instagramHandle = content['contact.instagram_handle']

  const hasRealItems = instagramItems.some((i) => i.imageUrl)

  return (
    <section className="bg-ivory-dim px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl text-center">
        <InstagramIcon className="mx-auto mb-4 text-gold" size={26} />
        <h2 className="font-display text-3xl text-ink lg:text-4xl">
          Acompanhe no Instagram
        </h2>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-[14px] font-medium text-garnet hover:underline"
        >
          {instagramHandle}
        </a>

        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {hasRealItems
            ? instagramItems.map((item, i) => (
                <motion.a
                  key={item.id}
                  href={item.linkUrl || instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-ink transition-transform hover:scale-[1.03]"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <JewelGlyph type="ring" className="h-10 w-10 text-gold/70 transition-colors group-hover:text-gold" />
                  )}
                </motion.a>
              ))
            : FALLBACK_GLYPHS.map((g, i) => (
                <motion.a
                  key={i}
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group flex aspect-square items-center justify-center rounded-xl bg-ink transition-transform hover:scale-[1.03]"
                >
                  <JewelGlyph type={g} className="h-10 w-10 text-gold/70 transition-colors group-hover:text-gold" />
                </motion.a>
              ))}
        </div>
      </div>
    </section>
  )
}
