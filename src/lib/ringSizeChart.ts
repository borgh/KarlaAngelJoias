// Conversão de tamanho de anel a partir da circunferência interna (mm).
//
// Fontes: padrão ISO 8653 (a base do sistema europeu — o número EU já
// É a circunferência interna em mm, por definição) e tabelas de
// referência cruzadas de joalherias BR/US/UK amplamente usadas no
// mercado. São valores aproximados por natureza (cada fabricante tem
// uma variação de décimos de mm) — por isso o resultado final sempre
// se apresenta como "aproximado", nunca como certeza absoluta.

export type RingSizeResult = {
  circumferenceMm: number
  diameterMm: number
  br: number // "aro" brasileiro
  us: number
  uk: string
  eu: number
}

// Sistema brasileiro (aro): na prática do mercado, aro ≈ circunferência
// interna (mm) − 40. Fórmula usada por referências de joalheria BR
// (confirma: aro 20 ≈ 60mm, aro 15 ≈ 55mm).
function toBrAro(circumferenceMm: number): number {
  return Math.round(circumferenceMm - 40)
}

// Sistema europeu/ISO: o número já É a circunferência interna em mm.
function toEu(circumferenceMm: number): number {
  return Math.round(circumferenceMm)
}

// Sistema americano: escala em meios-números, com US 3 ≈ 44.2mm e
// cada 0.5 de tamanho ≈ +2.55mm de circunferência (derivado da tabela
// padrão de referência da indústria).
function toUs(circumferenceMm: number): number {
  const raw = 3 + (circumferenceMm - 44.2) / 2.55
  return Math.round(raw * 2) / 2 // arredonda pro meio-número mais próximo
}

// Sistema britânico: letras A→Z (sem meios-tamanhos no uso comum),
// depois Z+1, Z+2… pra dedos maiores. Calibrado contra tabela de
// referência cruzada do mercado: G≈46,5mm, J≈50,3mm, N≈55,2mm (~US 7),
// R≈60,2mm — passo de ~1,25mm por letra.
const UK_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'Z+1', 'Z+2', 'Z+3', 'Z+4', 'Z+5',
]
const UK_START_MM = 39.05 // circunferência da letra "A"
const UK_STEP_MM = 1.25

function toUk(circumferenceMm: number): string {
  const index = Math.round((circumferenceMm - UK_START_MM) / UK_STEP_MM)
  const clamped = Math.max(0, Math.min(UK_LETTERS.length - 1, index))
  return UK_LETTERS[clamped]
}

export function circumferenceToResult(circumferenceMm: number): RingSizeResult {
  return {
    circumferenceMm: Math.round(circumferenceMm * 10) / 10,
    diameterMm: Math.round((circumferenceMm / Math.PI) * 10) / 10,
    br: toBrAro(circumferenceMm),
    us: toUs(circumferenceMm),
    uk: toUk(circumferenceMm),
    eu: toEu(circumferenceMm),
  }
}

export function diameterToResult(diameterMm: number): RingSizeResult {
  return circumferenceToResult(diameterMm * Math.PI)
}

// Faixa plausível pra validar entrada manual (evita número digitado
// errado, tipo confundir mm com cm).
export const MIN_CIRCUMFERENCE_MM = 38
export const MAX_CIRCUMFERENCE_MM = 75
