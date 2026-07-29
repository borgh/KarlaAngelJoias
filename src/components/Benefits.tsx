import { Truck, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'

const items = [
  { icon: Truck, title: 'Frete para todo o Brasil', desc: 'Envio cuidadoso, embalagem para presente' },
  { icon: ShieldCheck, title: 'Garantia de 1 ano', desc: 'Peças antialérgicas, livres de níquel' },
  { icon: CreditCard, title: 'Até 6x sem juros', desc: 'No cartão de crédito' },
  { icon: Sparkles, title: '5% off no Pix', desc: 'Desconto à vista' },
]

export function Benefits() {
  return (
    <section className="border-y border-ink/10 bg-ivory-dim px-6 py-14 lg:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon size={22} strokeWidth={1.3} className="mt-0.5 shrink-0 text-gold" />
            <div>
              <p className="text-[13px] font-semibold text-ink">{title}</p>
              <p className="text-[12px] text-ink/55">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
