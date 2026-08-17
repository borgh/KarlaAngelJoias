import { useState } from 'react'
import { useCardCalibration } from '../../lib/useCardCalibration'
import { CardCalibrator } from './CardCalibrator'
import { diameterToResult } from '../../lib/ringSizeChart'
import { RingSizeResultCard } from './RingSizeResultCard'

export function ScreenTab() {
  const { pxPerMm, setPxPerMm, clearCalibration } = useCardCalibration()
  const [diameterPx, setDiameterPx] = useState(60)
  const [measured, setMeasured] = useState(false)

  if (measured && pxPerMm) {
    const diameterMm = diameterPx / pxPerMm
    return <RingSizeResultCard result={diameterToResult(diameterMm)} onReset={() => setMeasured(false)} />
  }

  if (!pxPerMm) {
    return <CardCalibrator onCalibrated={setPxPerMm} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-sm text-center text-[14px] text-ivory/70">
        Coloque um anel que já sirva em cima do círculo abaixo e ajuste até a borda interna dele bater exatamente com
        a borda do círculo.
      </p>

      <div className="flex h-64 w-full items-center justify-center">
        <div
          className="rounded-full border-2 border-dashed border-gold bg-gold/10 transition-[width,height] duration-75"
          style={{ width: diameterPx, height: diameterPx }}
        />
      </div>

      <input
        type="range"
        min={30}
        max={140}
        step={0.5}
        value={diameterPx}
        onChange={(e) => setDiameterPx(Number(e.target.value))}
        className="w-full max-w-xs accent-gold"
        aria-label="Ajustar tamanho do círculo"
      />

      <div className="flex gap-3">
        <button
          onClick={() => setMeasured(true)}
          className="rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright"
        >
          Ver tamanho
        </button>
        <button
          onClick={clearCalibration}
          className="rounded-full border border-ivory/20 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ivory/60 hover:border-gold hover:text-gold"
        >
          Recalibrar
        </button>
      </div>
    </div>
  )
}
