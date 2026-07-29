import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { JewelGlyph } from './JewelGlyph'
import { WHATSAPP_URL } from '../data/site'

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden bg-ink text-ivory">
      {/* textura sutil de vinheta dourada */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(60% 50% at 85% 10%, rgba(200,154,76,0.20), transparent), radial-gradient(40% 40% at 10% 90%, rgba(200,154,76,0.12), transparent)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-12 lg:pb-28 lg:pt-44">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-[13px] font-semibold uppercase tracking-[0.28em] text-gold"
          >
            Ouro 18k · Prata 925 · Moissanite
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="font-display text-[13vw] leading-[0.98] tracking-tight sm:text-6xl lg:text-[5.2rem]"
          >
            Joias para
            <br />
            <span className="text-gradient-gold italic">o seu brilho</span>
            <br />
            de todo dia.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 max-w-md text-[15px] leading-relaxed text-ivory/70"
          >
            Curadoria exclusiva de semijoias de luxo: ouro 18k, prata 925
            e peças em moissanite, com o brilho e o acabamento de uma
            joalheria — para usar todos os dias ou guardar para ocasiões
            especiais.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#mais-vendidos"
              className="rounded-full bg-gold px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink transition-transform hover:scale-[1.03] hover:bg-gold-bright"
            >
              Ver coleção
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ivory/25 px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              Falar no WhatsApp
            </a>
          </motion.div>
        </div>

        {/* composição de joias em linha, flutuante */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute inset-0 rounded-full border border-gold/25"
          />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-[8%] top-[10%] w-36 text-gold"
          >
            <JewelGlyph type="necklace" className="drop-shadow-[0_0_18px_rgba(200,154,76,0.25)]" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute right-[6%] top-[30%] w-28 text-gold-bright"
          >
            <JewelGlyph type="ring" className="drop-shadow-[0_0_18px_rgba(200,154,76,0.25)]" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-[10%] left-[24%] w-24 text-gold"
          >
            <JewelGlyph type="earring" className="drop-shadow-[0_0_18px_rgba(200,154,76,0.25)]" />
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#colecoes"
        aria-label="Rolar para coleções"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ivory/50 transition-colors hover:text-gold"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowDown size={20} strokeWidth={1.3} />
      </motion.a>
    </section>
  )
}
