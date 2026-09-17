import { Truck, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'
import { useSiteData } from '../context/SiteDataContext'

const ICONS = [Truck, ShieldCheck, CreditCard, Sparkles]

export function Benefits() {
  const { content } = useSiteData()
  const items = ICONS.map((icon, i) => ({
    icon,
    title: content[`benefits.${i + 1}_title`],
    desc: content[`benefits.${i + 1}_desc`],
  })).filter((b) => b.title)
  return (
    <section className="border-y border-taupe/60 bg-ivory-dim px-6 py-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon size={20} strokeWidth={1.2} className="mt-0.5 shrink-0 text-gold" />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink">{title}</p>
              <p className="text-[12px] text-ink/55">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
