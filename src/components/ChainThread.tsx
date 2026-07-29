import { useEffect, useRef, useState } from 'react'

/**
 * Elemento assinatura da marca: uma linha vertical fina, à esquerda do
 * conteúdo, pontuada por pequenos elos — como um colar estendido pela
 * página. Preenche a ouro conforme o visitante rola, ligando literalmente
 * as seções (o mesmo princípio de um colar de elos que a marca vende).
 * Oculto em telas pequenas para não competir com o conteúdo no mobile.
 */
export function ChainThread() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      if (scrollable <= 0) return
      setProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = 14

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-6 top-0 z-40 hidden h-screen w-6 lg:block"
    >
      <div className="relative mx-auto h-full w-px bg-ink/10">
        <div
          className="absolute left-0 top-0 w-px bg-gradient-to-b from-gold via-gold-bright to-gold transition-[height] duration-150 ease-out"
          style={{ height: `${progress * 100}%` }}
        />
        {Array.from({ length: links }).map((_, i) => {
          const at = i / (links - 1)
          const lit = at <= progress
          return (
            <span
              key={i}
              className="absolute -left-[5px] h-[11px] w-[11px] rounded-full border transition-colors duration-300"
              style={{
                top: `${at * 100}%`,
                borderColor: lit ? 'var(--color-gold)' : 'rgba(14,33,24,0.15)',
                backgroundColor: lit ? 'var(--color-ivory)' : 'transparent',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
