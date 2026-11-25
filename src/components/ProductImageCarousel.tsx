import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react'
import { JewelGlyph } from './JewelGlyph'
import { Sparkles, Shimmer } from './Sparkles'
import type { Glyph, ProductVideo } from '../lib/viewTypes'

type Media = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string }

export function ProductImageCarousel({
  images,
  videos = [],
  glyph,
  alt,
  seed,
  grayscale,
  badge,
}: {
  images: string[]
  videos?: ProductVideo[]
  glyph: Glyph
  alt: string
  seed: string
  grayscale?: boolean
  badge?: string
}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [muted, setMuted] = useState(true)
  // Fotos primeiro, vídeos depois.
  const media: Media[] = [
    ...images.map((src) => ({ kind: 'image' as const, src })),
    ...videos.map((v) => ({ kind: 'video' as const, src: v.url, poster: v.poster })),
  ]
  const current = media[index] ?? media[0]

  // Volta pra primeira foto sempre que o produto muda (o carrossel é
  // reaproveitado entre produtos diferentes — sem isso, abrir um
  // produto novo continuaria mostrando a 3ª foto do produto anterior).
  useEffect(() => {
    setIndex(0)
    setDirection(0)
    setMuted(true)
  }, [seed])

  function go(newIndex: number) {
    setDirection(newIndex > index ? 1 : -1)
    setIndex(((newIndex % media.length) + media.length) % media.length)
  }

  const hasMultiple = media.length > 1

  return (
    <div className="relative flex h-0 w-full items-center justify-center overflow-hidden bg-ivory-dim pb-[100%] sm:h-auto sm:min-h-[420px] sm:pb-0">
      {badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-rose px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          {badge}
        </span>
      )}

      {media.length === 0 ? (
        <JewelGlyph type={glyph} className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-gold" />
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={index}
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
              className="absolute inset-0"
            >
              {current.kind === 'image' ? (
                <img
                  src={current.src}
                  alt={alt}
                  draggable={false}
                  className={`h-full w-full object-cover ${grayscale ? 'grayscale' : ''}`}
                />
              ) : (
                <video
                  src={current.src}
                  poster={current.poster || undefined}
                  autoPlay
                  loop
                  muted={muted}
                  playsInline
                  preload="metadata"
                  aria-label={`Vídeo: ${alt}`}
                  className="h-full w-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {current?.kind === 'video' && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Ativar som' : 'Desativar som'}
          className="absolute bottom-9 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {current?.kind !== 'video' && <Shimmer seed={seed} />}
      {current?.kind !== 'video' && <Sparkles seed={seed} count={7} />}

      {hasMultiple && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Próximo"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {media.map((m, i) =>
              m.kind === 'video' ? (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Ver vídeo ${i - images.length + 1}`}
                  className={`-my-1 flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${
                    i === index ? 'bg-ink text-ivory' : 'bg-ink/35 text-ivory hover:bg-ink/60'
                  }`}
                >
                  <Play size={7} fill="currentColor" />
                </button>
              ) : (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-4 bg-ink' : 'w-1.5 bg-ink/35 hover:bg-ink/60'
                  }`}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
