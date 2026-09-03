import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { JewelGlyph } from './JewelGlyph'
import { Sparkles, Shimmer } from './Sparkles'
import type { Glyph } from '../lib/viewTypes'

export function ProductImageCarousel({
  images,
  glyph,
  alt,
  seed,
  grayscale,
  badge,
}: {
  images: string[]
  glyph: Glyph
  alt: string
  seed: string
  grayscale?: boolean
  badge?: string
}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Volta pra primeira foto sempre que o produto muda (o carrossel é
  // reaproveitado entre produtos diferentes — sem isso, abrir um
  // produto novo continuaria mostrando a 3ª foto do produto anterior).
  useEffect(() => {
    setIndex(0)
    setDirection(0)
  }, [seed])

  function go(newIndex: number) {
    setDirection(newIndex > index ? 1 : -1)
    setIndex(((newIndex % images.length) + images.length) % images.length)
  }

  const hasMultiple = images.length > 1

  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-ink sm:aspect-auto">
      {badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
          {badge}
        </span>
      )}

      {images.length === 0 ? (
        <JewelGlyph type={glyph} className="h-32 w-32 text-gold/80" />
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={index}
              src={images[index]}
              alt={alt}
              custom={direction}
              initial={{ x: direction >= 0 ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction >= 0 ? '-100%' : '100%', opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              drag={hasMultiple ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1)
                else if (info.offset.x > 60) go(index - 1)
              }}
              className={`absolute inset-0 h-full w-full object-cover ${grayscale ? 'grayscale' : ''}`}
            />
          </AnimatePresence>
        </div>
      )}

      <Shimmer seed={seed} />
      <Sparkles seed={seed} count={7} />

      {hasMultiple && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/80"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/80"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-4 bg-ivory' : 'w-1.5 bg-ivory/40 hover:bg-ivory/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
