type GlyphType = 'ring' | 'earring' | 'necklace' | 'bracelet'

// Ilustrações de linha originais (traço fino, estilo joalheria) usadas como
// placeholder visual até a substituição pelas fotografias reais das peças.
export function JewelGlyph({ type, className }: { type: GlyphType; className?: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (type) {
    case 'ring':
      return (
        <svg viewBox="0 0 120 120" className={className} {...common}>
          <circle cx="60" cy="68" r="34" />
          <path d="M46 38 L60 14 L74 38" />
          <path d="M52 40 L60 22 L68 40" />
          <circle cx="60" cy="34" r="5" />
        </svg>
      )
    case 'earring':
      return (
        <svg viewBox="0 0 120 120" className={className} {...common}>
          <path d="M60 18 a14 14 0 1 1 -0.1 0" />
          <path d="M60 32 L60 52" />
          <circle cx="60" cy="68" r="16" />
          <path d="M60 84 L60 100" />
          <circle cx="60" cy="106" r="4" />
        </svg>
      )
    case 'necklace':
      return (
        <svg viewBox="0 0 120 120" className={className} {...common}>
          <path d="M20 24 C20 70 100 70 100 24" />
          <path d="M55 68 L60 96 L65 68" />
          <circle cx="60" cy="94" r="6" />
        </svg>
      )
    case 'bracelet':
    default:
      return (
        <svg viewBox="0 0 120 120" className={className} {...common}>
          <ellipse cx="60" cy="60" rx="46" ry="22" />
          <ellipse cx="60" cy="60" rx="34" ry="14" />
          <path d="M14 60 h12 M94 60 h12" />
        </svg>
      )
  }
}
