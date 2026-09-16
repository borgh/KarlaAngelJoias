import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'
import { lineHref } from '../lib/lines'

// Fotos do brand book (Identidade Visual 2025 — Laís Nass Design),
// extraídas do PDF e otimizadas pra web (public/brand/hero-*.jpg).
// `position` ajusta o foco no recorte vertical do celular (rosto/peça
// sempre visíveis, mesmo com a imagem em 16:9 cortada pra retrato).
// O 1º slide usa os textos editáveis no painel admin (Textos do site →
// Hero); os outros dois apresentam as linhas da marca.
const SLIDES = [
  {
    src: '/brand/hero-1.jpg',
    position: '50% 35%',
    eyebrow: '',
    title: '',
    cta: { label: 'Ver mais vendidos', href: '#mais-vendidos' },
  },
  {
    src: '/brand/hero-2.jpg',
    position: '60% 50%',
    eyebrow: 'Semijoias · banho de ouro 18k',
    title: 'Acabamento de\njoalheria, todo dia.',
    cta: { label: 'Ver semijoias', href: lineHref('semijoia') },
  },
  {
    src: '/brand/hero-3.jpg',
    position: '55% 40%',
    eyebrow: 'Easy chic',
    title: 'Camadas de ouro\npara compor o seu look.',
    cta: { label: 'Ver joias', href: lineHref('joias') },
  },
]

const INTERVAL_MS = 6500

export function Hero() {
  const { content } = useSiteData()
  const whatsappUrl = buildWhatsappUrl(content)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | null>(null)

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

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

  const slide = SLIDES[index]
  const eyebrow = index === 0 ? content['hero.eyebrow'] : slide.eyebrow
  const title =
    index === 0
      ? [content['hero.title_line1'], content['hero.title_line2'], content['hero.title_line3']]
          .filter(Boolean)
          .join('\n')
      : slide.title

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
          <img
            src={slide.src}
            alt=""
            className="h-full w-full animate-kenburns object-cover"
            style={{ objectPosition: slide.position }}
            draggable={false}
          />
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
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles */}
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
    </section>
  )
}
