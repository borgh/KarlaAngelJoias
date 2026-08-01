import type { CSSProperties } from 'react'

// Gera um número pseudo-aleatório determinístico a partir de uma string
// (o id do produto) — assim as estrelas (e o brilho) ficam com timing
// fixo para cada peça, em vez de mudar a cada re-render.
export function seededRandom(seed: string, index: number) {
  let h = 0
  const str = `${seed}-${index}`
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h % 1000) / 1000
}

export function StarShape({
  size,
  className,
  style,
}: {
  size: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <path
        d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Brilho diagonal com timing aleatório (mas estável) por produto — cada
// peça "flasheia" em um momento diferente, então o brilho e as estrelas
// nunca ficam todos sincronizados, dão a sensação de cintilar aleatório.
export function Shimmer({ seed }: { seed: string }) {
  const duration = 5 + seededRandom(seed, 90) * 4 // 5-9s de ciclo total
  const delay = seededRandom(seed, 91) * 5 // início defasado

  return (
    <div
      className="shimmer-bg pointer-events-none absolute inset-0"
      style={{ animation: `shimmer ${duration}s ease-in-out ${delay}s infinite` }}
    />
  )
}

export function Sparkles({ seed, count = 5 }: { seed: string; count?: number }) {
  const stars = Array.from({ length: count }).map((_, i) => {
    const top = 10 + seededRandom(seed, i * 3) * 80
    const left = 10 + seededRandom(seed, i * 3 + 1) * 80
    const size = 6 + seededRandom(seed, i * 3 + 2) * 10
    const duration = 2.2 + seededRandom(seed, i * 7) * 2.2
    const delay = seededRandom(seed, i * 11) * 4
    return { top, left, size, duration, delay, key: i }
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <StarShape
          key={s.key}
          size={s.size}
          className="absolute text-gold-bright drop-shadow-[0_0_4px_rgba(227,194,126,0.9)]"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: 0,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
