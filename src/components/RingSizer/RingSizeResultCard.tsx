import { CheckCircle2 } from 'lucide-react'
import type { RingSizeResult } from '../../lib/ringSizeChart'

export function RingSizeResultCard({ result, onReset }: { result: RingSizeResult; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex items-center gap-2 text-gold">
        <CheckCircle2 size={22} />
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em]">Medida encontrada</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Brasil (aro)', value: result.br },
          { label: 'EUA', value: result.us },
          { label: 'Reino Unido', value: result.uk },
          { label: 'Europa/ISO', value: result.eu },
        ].map((r) => (
          <div key={r.label} className="rounded-2xl border border-ivory/15 bg-ink-soft/60 px-4 py-5">
            <p className="font-display text-3xl text-gold">{r.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ivory/50">{r.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-ivory/50">
        Circunferência interna: {result.circumferenceMm}mm · Diâmetro: {result.diameterMm}mm
      </p>

      <p className="max-w-md text-[12px] leading-relaxed text-ivory/40">
        Medida aproximada. Para anéis anatômicos (mais largos), considere um número abaixo do indicado. Em caso de
        dúvida entre dois tamanhos, fale com a gente pelo WhatsApp antes de finalizar a compra.
      </p>

      <button
        onClick={onReset}
        className="text-[12px] font-semibold uppercase tracking-wide text-ivory/50 underline decoration-gold/40 underline-offset-4 hover:text-gold"
      >
        Medir de novo
      </button>
    </div>
  )
}
