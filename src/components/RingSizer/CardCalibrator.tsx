import { useRef, useState } from 'react'
import { CARD_WIDTH_MM } from '../../lib/useCardCalibration'

// Retângulo na tela que o usuário ajusta (arrastando um slider) até o
// tamanho bater com um cartão de crédito/débito real encostado na
// tela — o mesmo princípio usado por praticamente todo medidor de
// anel online (inclusive o da concorrência), porque é o jeito mais
// confiável de calibrar sem depender de saber a densidade de pixel
// exata do aparelho.
export function CardCalibrator({
  onCalibrated,
}: {
  onCalibrated: (pxPerMm: number) => void
}) {
  // Começa numa largura plausível pra maioria das telas de celular
  // (~320px pro cartão inteiro) — só um ponto de partida, o usuário
  // ajusta a partir daí.
  const [widthPx, setWidthPx] = useState(320)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleConfirm() {
    const pxPerMm = widthPx / CARD_WIDTH_MM
    onCalibrated(pxPerMm)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-sm text-center text-[14px] text-ink/70">
        Encoste um <strong className="text-ink">cartão de crédito/débito real</strong> na tela e ajuste o controle
        abaixo até o retângulo ficar exatamente do mesmo tamanho do cartão.
      </p>

      <div ref={containerRef} className="flex w-full items-center justify-center overflow-hidden py-4">
        <div
          className="rounded-lg border-2 border-dashed border-gold bg-gold/10 transition-[width,height] duration-75"
          style={{ width: widthPx, height: widthPx * (53.98 / 85.6) }}
        />
      </div>

      <input
        type="range"
        min={180}
        max={480}
        step={1}
        value={widthPx}
        onChange={(e) => setWidthPx(Number(e.target.value))}
        className="w-full max-w-xs accent-gold"
        aria-label="Ajustar tamanho do retângulo de calibração"
      />

      <button
        onClick={handleConfirm}
        className="rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright"
      >
        Confirmar calibração
      </button>
    </div>
  )
}
