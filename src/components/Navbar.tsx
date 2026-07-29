import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { InstagramIcon } from './icons/InstagramIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { WHATSAPP_URL, INSTAGRAM_URL } from '../data/site'

const LINKS = [
  { href: '#colecoes', label: 'Coleções' },
  { href: '#mais-vendidos', label: 'Mais vendidos' },
  { href: '#historia', label: 'Nossa história' },
  { href: '#contato', label: 'Contato' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-ivory/85 backdrop-blur-md shadow-[0_1px_0_0_rgba(14,33,24,0.08)]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
        <a
          href="#topo"
          className={`font-display text-xl tracking-wide transition-colors duration-500 ${
            scrolled ? 'text-ink' : 'text-ivory'
          }`}
        >
          Karla Angel <span className="text-gold">Joias</span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`group relative text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-500 ${
                  scrolled ? 'text-ink/80 hover:text-ink' : 'text-ivory/85 hover:text-ivory'
                }`}
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram Karla Angel Joias"
            className={`transition-colors duration-500 hover:text-gold ${scrolled ? 'text-ink/70' : 'text-ivory/80'}`}
          >
            <InstagramIcon size={18} />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full border px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all duration-500 hover:border-gold hover:bg-gold hover:text-ink ${
              scrolled ? 'border-ink/15 text-ink' : 'border-ivory/35 text-ivory'
            }`}
          >
            Fale conosco
          </a>
        </div>

        <button
          className={`transition-colors duration-500 md:hidden ${scrolled ? 'text-ink' : 'text-ivory'}`}
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/98 backdrop-blur md:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-display text-xl text-ivory">Karla Angel Joias</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="text-ivory">
                <X size={26} strokeWidth={1.5} />
              </button>
            </div>
            <ul className="mt-10 flex flex-col items-center gap-8">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl text-ivory"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 rounded-full bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-ink"
              >
                Fale no WhatsApp
              </a>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
