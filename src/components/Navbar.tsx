import { useEffect, useState } from 'react'
import { Menu, X, Ruler, ChevronRight } from 'lucide-react'
import { InstagramIcon } from './icons/InstagramIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'
import { RingSizerModal } from './RingSizer/RingSizerModal'
import { LINES, lineHref } from '../lib/lines'

// Menu principal — as 4 linhas da marca primeiro (eixo de navegação
// pedido pela cliente), depois as seções institucionais já existentes.
const LINE_LINKS = LINES.map((l) => ({ href: lineHref(l.id), label: l.label }))
const SECTION_LINKS = [
  { href: '#colecoes', label: 'Coleções' },
  { href: '#mais-vendidos', label: 'Mais vendidos' },
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#historia', label: 'Nossa história' },
  { href: '#contato', label: 'Contato' },
]

export function Navbar() {
  const { content } = useSiteData()
  const whatsappUrl = buildWhatsappUrl(content)
  const instagramUrl = content['contact.instagram_url']
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [ringSizerOpen, setRingSizerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava o scroll da página enquanto a gaveta mobile está aberta
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Barra de avisos — some ao rolar pra ganhar espaço, como no H.Stern */}
      <div
        className={`overflow-hidden bg-rose text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-all duration-500 ${
          scrolled ? 'max-h-0 py-0' : 'max-h-10 py-2'
        }`}
      >
        {content['announcement.text']}
      </div>

      <div
        className={`border-b transition-all duration-500 ${
          scrolled ? 'border-taupe/60 bg-ivory/92 shadow-[0_1px_12px_rgba(74,64,60,0.06)] backdrop-blur-md' : 'border-transparent bg-ivory'
        }`}
      >
        {/* Linha 1: hambúrguer (mobile) · logo centralizada · ícones de ação */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10 lg:py-5">
          <div className="flex w-24 items-center lg:w-56">
            <button
              className="text-ink lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} strokeWidth={1.4} />
            </button>
            <button
              onClick={() => setRingSizerOpen(true)}
              className="hidden items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink/70 transition-colors hover:text-rose-deep lg:flex"
            >
              <Ruler size={14} strokeWidth={1.5} /> Guia de medidas
            </button>
          </div>

          <a href="#topo" aria-label="Karla Angel — início" className="block">
            <img
              src="/brand/logo-dark.png"
              alt="Karla Angel"
              className={`transition-all duration-500 ${scrolled ? 'h-[22px] lg:h-[26px]' : 'h-[26px] lg:h-[34px]'} w-auto`}
              draggable={false}
            />
          </a>

          <div className="flex w-24 items-center justify-end gap-3 lg:w-56 lg:gap-5">
            <button
              onClick={() => setRingSizerOpen(true)}
              aria-label="Guia de medidas"
              className="text-ink/70 transition-colors hover:text-rose-deep lg:hidden"
            >
              <Ruler size={20} strokeWidth={1.4} />
            </button>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Karla Angel"
              className="text-ink/70 transition-colors hover:text-rose-deep"
            >
              <InstagramIcon size={19} />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden whitespace-nowrap rounded-full border border-ink/20 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition-all hover:border-rose hover:bg-rose hover:text-white lg:inline-block"
            >
              Fale conosco
            </a>
          </div>
        </div>

        {/* Linha 2 (desktop): menu horizontal centralizado */}
        <nav className="hidden border-t border-taupe/40 lg:block">
          <ul className="mx-auto flex max-w-7xl items-center justify-center gap-9 px-10 py-3">
            {LINE_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative text-[12px] font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:text-rose-deep"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-rose-deep transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
            <li aria-hidden="true" className="h-4 w-px bg-taupe" />
            {SECTION_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative text-[12px] uppercase tracking-[0.2em] text-ink/65 transition-colors hover:text-rose-deep"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-rose-deep transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Gaveta mobile/tablet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col bg-ivory lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-taupe/60 px-6 py-5">
                <img src="/brand/logo-dark.png" alt="Karla Angel" className="h-5 w-auto" />
                <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="text-ink">
                  <X size={24} strokeWidth={1.4} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-taupe-deep">Linhas</p>
                <ul className="mb-8 divide-y divide-taupe/40">
                  {LINE_LINKS.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between py-4 font-display text-xl tracking-[0.08em] text-ink"
                      >
                        {l.label}
                        <ChevronRight size={18} strokeWidth={1.4} className="text-taupe-deep" />
                      </a>
                    </motion.li>
                  ))}
                </ul>

                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-taupe-deep">Navegue</p>
                <ul className="divide-y divide-taupe/40">
                  {SECTION_LINKS.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="block py-3.5 text-[13px] uppercase tracking-[0.16em] text-ink/75"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => {
                        setOpen(false)
                        setRingSizerOpen(true)
                      }}
                      className="flex items-center gap-2 py-3.5 text-[13px] uppercase tracking-[0.16em] text-ink/75"
                    >
                      <Ruler size={16} strokeWidth={1.5} /> Guia de medidas
                    </button>
                  </li>
                </ul>
              </div>

              <div className="border-t border-taupe/60 px-6 py-5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-full bg-rose py-3 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Fale no WhatsApp
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <RingSizerModal open={ringSizerOpen} onClose={() => setRingSizerOpen(false)} />
    </header>
  )
}
