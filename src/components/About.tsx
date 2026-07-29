import { motion } from 'framer-motion'

export function About() {
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
          <p>
            A Karla Angel nasceu de uma curadoria pessoal: peças em ouro
            18k, prata 925 e moissanite escolhidas a dedo, com o mesmo
            padrão de acabamento de uma joalheria — para usar no dia a
            dia ou guardar para uma data especial.
          </p>
          <p>
            Do anel de entrada à riviera cravejada, cada lançamento passa
            por uma seleção criteriosa antes de chegar até você — com
            garantia, autenticidade e o cuidado de quem entende de joia.
          </p>
          <div className="grid grid-cols-3 gap-6 pt-4">
            {[
              ['+4.300', 'seguidoras no Instagram'],
              ['423', 'peças e posts publicados'],
              ['100%', 'curadoria exclusiva'],
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
