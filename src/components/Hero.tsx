import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'

// Slides vêm de "Textos do site" no admin (hero.slideN_*). Slide sem
// imagem não aparece. `position` ajusta o foco no recorte do celular.
const SLIDE_POSITIONS = ['50% 35%', '60% 50%', '55% 40%', '50% 50%']

type Slide = { src: string; position: string; eyebrow: string; title: string; cta: { label: string; href: string } }

function slidesFromContent(content: Record<string, string>): Slide[] {
  const out: Slide[] = []
  for (let n = 1; n <= 4; n++) {
    const src = (content[`hero.slide${n}_image`] || '').trim()
    if (!src) continue
    out.push({
      src,
      position: SLIDE_POSITIONS[n - 1],
      eyebrow: content[`hero.slide${n}_eyebrow`] || '',
      title: content[`hero.slide${n}_title`] || '',
      cta: {
        label: content[`hero.slide${n}_cta_label`] || 'Ver peças',
        href: content[`hero.slide${n}_cta_href`] || '#catalogo',
      },
    })
  }
  return out
}

const INTERVAL_MS = 6500

export function Hero() {
  const { content } = useSiteData()
  const whatsappUrl = buildWhatsappUrl(content)
  const SLIDES = slidesFromContent(content)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | null>(null)

  const count = Math.max(SLIDES.length, 1)
  const go = useCallback((next: number) => {
    setIndex(((next % count) + count) % count)
  }, [count])

  // Autoplay — pausa quando o mouse está em cima ou quando a aba
  // perde o foco (não gasta bateria trocando slide que ninguém vê).
  useEffect(() => {
    if (paused) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    timer.current = window.setInterval(() => go(index + 1), INTERVAL_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [index, paused, go])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const slide = SLIDES[Math.min(index, SLIDES.length - 1)] ?? {
    src: '', position: '50% 50%', eyebrow: '', title: '', cta: { label: '', href: '#catalogo' },
  }
  const eyebrow = slide.eyebrow
  const title = slide.title

  return (
    <section
      id="topo"
      className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-taupe lg:h-[88vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
    >
      {/* Fotos em fundo com fade + zoom lento (Ken Burns) */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {slide.src && (
          <img
            src={slide.src}
            alt=""
            className="h-full w-full animate-kenburns object-cover"
            style={{ objectPosition: slide.position }}
            draggable={false}
          />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Véu suave pra legibilidade do texto, sem escurecer a foto toda */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/35 via-transparent to-transparent" />

      {/* Texto */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 lg:px-12 lg:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.src}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-xl text-white"
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-white/80">{eyebrow}</p>
            <h1 className="whitespace-pre-line font-display text-4xl font-light leading-[1.08] tracking-[0.02em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={slide.cta.href}
                className="rounded-full bg-white px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-rose hover:text-white"
              >
                {slide.cta.label}
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/60 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/15"
              >
                {content['hero.whatsapp_label']}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles */}
      {SLIDES.length > 1 && (<>
      <button
        onClick={() => go(index - 1)}
        aria-label="Slide anterior"
        className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white lg:flex"
      >
        <ChevronLeft size={20} strokeWidth={1.4} />
      </button>
      <button
        onClick={() => go(index + 1)}
        aria-label="Próximo slide"
        className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white lg:flex"
      >
        <ChevronRight size={20} strokeWidth={1.4} />
      </button>

      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            onClick={() => go(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              i === index ? 'w-10 bg-white' : 'w-5 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
      </>)}
    </section>
  )
}
