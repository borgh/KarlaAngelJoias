// Ajusta automaticamente a posição/tamanho/rotação do quadro de
// calibração do cartão pra encaixar nas bordas reais dele na foto —
// sem depender de uma biblioteca pesada de visão computacional
// (avaliamos usar OpenCV.js, mas ela tem bugs documentados de
// instabilidade com o Vite, ver docs/troubleshooting.md).
//
// Técnica: busca local por "subida de encosta" (hill climbing) a
// partir da posição inicial (o guia já mostrado na câmera) — soma a
// intensidade de borda (gradiente Sobel) ao longo do perímetro do
// retângulo candidato, e vai ajustando posição/tamanho/ângulo aos
// poucos, sempre mantendo a mudança só se a pontuação melhorar. Como
// já sabemos aproximadamente onde o cartão está (o usuário foi
// instruído a encaixar ali), a busca não precisa varrer a foto
// inteira — só refinar localmente, o que é rápido e mais confiável
// que detecção de objeto genérica.

export type CardRectState = { cx: number; cy: number; w: number; h: number; rotationDeg: number }

const DOWNSCALE_WIDTH = 320

function buildGradientMap(canvas: HTMLCanvasElement): { data: Float32Array; w: number; h: number } {
  const scale = DOWNSCALE_WIDTH / canvas.width
  const w = DOWNSCALE_WIDTH
  const h = Math.round(canvas.height * scale)

  const small = document.createElement('canvas')
  small.width = w
  small.height = h
  const sctx = small.getContext('2d', { willReadFrequently: true })!
  sctx.drawImage(canvas, 0, 0, w, h)
  const { data: rgba } = sctx.getImageData(0, 0, w, h)

  // Escala de cinza
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  // Sobel — magnitude do gradiente
  const grad = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
        gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1]
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
        gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
      grad[i] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return { data: grad, w, h }
}

function sampleGrad(map: { data: Float32Array; w: number; h: number }, xFrac: number, yFrac: number): number {
  const x = Math.round(xFrac * map.w)
  const y = Math.round(yFrac * map.h)
  if (x < 0 || x >= map.w || y < 0 || y >= map.h) return 0
  return map.data[y * map.w + x]
}

// Pontuação de um retângulo candidato: soma da intensidade de borda
// ao longo das 4 laterais (perímetro) MENOS uma penalidade pela
// variação de gradiente no INTERIOR — um cartão de verdade bem
// encaixado tem interior relativamente uniforme (só a superfície do
// cartão); um retângulo errado (grande demais ou pequeno demais)
// tende a pegar mistura de fundo+cartão, ou detalhes internos do
// cartão (chip, texto, logo) que sem essa penalidade poderiam
// "enganar" a busca fazendo ela parar cedo demais, pegando um detalhe
// interno em vez da borda externa real.
function scoreRect(map: { data: Float32Array; w: number; h: number }, rect: CardRectState): number {
  const rad = (rect.rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = rect.w / 2
  const hh = rect.h / 2
  const POINTS_PER_EDGE = 14
  let perimeterSum = 0

  function toWorld(lx: number, ly: number) {
    return { x: rect.cx + (lx * cos - ly * sin), y: rect.cy + (lx * sin + ly * cos) }
  }

  for (let i = 0; i < POINTS_PER_EDGE; i++) {
    const t = i / (POINTS_PER_EDGE - 1) - 0.5
    let p = toWorld(t * rect.w, -hh)
    perimeterSum += sampleGrad(map, p.x, p.y)
    p = toWorld(t * rect.w, hh)
    perimeterSum += sampleGrad(map, p.x, p.y)
    p = toWorld(-hw, t * rect.h)
    perimeterSum += sampleGrad(map, p.x, p.y)
    p = toWorld(hw, t * rect.h)
    perimeterSum += sampleGrad(map, p.x, p.y)
  }

  // Amostra uma grade 4x4 do interior (afastada da borda, 20%-80% do
  // retângulo) e penaliza a MÉDIA de gradiente ali — interior real do
  // cartão costuma ser mais uniforme que "meio fundo, meio cartão"
  // ou "em cima de um detalhe interno".
  let interiorSum = 0
  let interiorCount = 0
  for (let iy = -0.3; iy <= 0.3; iy += 0.2) {
    for (let ix = -0.3; ix <= 0.3; ix += 0.2) {
      const p = toWorld(ix * rect.w, iy * rect.h)
      interiorSum += sampleGrad(map, p.x, p.y)
      interiorCount++
    }
  }
  const interiorPenalty = (interiorSum / interiorCount) * POINTS_PER_EDGE * 4 * 0.5

  return perimeterSum - interiorPenalty
}

export function refineCardRect(canvas: HTMLCanvasElement, initial: CardRectState): CardRectState {
  const map = buildGradientMap(canvas)
  const initialScore = scoreRect(map, initial)

  // Fase 1 — busca grosseira em grade: testa combinações de posição
  // (deslocamentos maiores) e escala (encolher/esticar o retângulo)
  // ao redor do ponto de partida. Isso existe porque a busca fina
  // (fase 2) andando em passos pequenos pode ficar "presa" — se o
  // retângulo inicial for maior que o cartão real, a borda dele cai
  // fora do cartão (numa região sem gradiente nenhum, tipo a mesa ao
  // redor), e passos pequenos nunca "sentem" a borda de verdade até
  // cruzar ela de vez — precisa de um salto maior pra escapar dessa
  // região "achatada".
  let best = { ...initial }
  let bestScore = initialScore
  const positionOffsets = [-0.08, -0.04, 0, 0.04, 0.08]
  const scaleFactors = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4]
  for (const dx of positionOffsets) {
    for (const dy of positionOffsets) {
      for (const sw of scaleFactors) {
        for (const sh of scaleFactors) {
          const candidate: CardRectState = {
            cx: initial.cx + dx,
            cy: initial.cy + dy,
            w: Math.min(0.9, Math.max(0.08, initial.w * sw)),
            h: Math.min(0.9, Math.max(0.08, initial.h * sh)),
            rotationDeg: initial.rotationDeg,
          }
          const s = scoreRect(map, candidate)
          if (s > bestScore) {
            bestScore = s
            best = candidate
          }
        }
      }
    }
  }

  // Fase 1b — varredura grosseira de rotação (separada da grade
  // acima pra não multiplicar demais o número de combinações),
  // partindo da melhor posição/escala já encontrada.
  for (const rot of [-30, -20, -10, 0, 10, 20, 30]) {
    const candidate = { ...best, rotationDeg: initial.rotationDeg + rot }
    const s = scoreRect(map, candidate)
    if (s > bestScore) {
      bestScore = s
      best = candidate
    }
  }

  // Fase 2 — refinamento fino: passos de ajuste decrescentes,
  // clássico "coordinate descent", partindo do melhor ponto já
  // encontrado na fase grosseira.
  const steps = [0.02, 0.01, 0.005, 0.0025]
  for (const step of steps) {
    let improved = true
    let iterations = 0
    while (improved && iterations < 40) {
      improved = false
      iterations++
      const candidates: CardRectState[] = [
        { ...best, cx: best.cx - step },
        { ...best, cx: best.cx + step },
        { ...best, cy: best.cy - step },
        { ...best, cy: best.cy + step },
        { ...best, w: Math.max(0.08, best.w - step) },
        { ...best, w: Math.min(0.9, best.w + step) },
        { ...best, h: Math.max(0.08, best.h - step) },
        { ...best, h: Math.min(0.9, best.h + step) },
        { ...best, rotationDeg: best.rotationDeg - step * 300 },
        { ...best, rotationDeg: best.rotationDeg + step * 300 },
      ]
      for (const c of candidates) {
        const s = scoreRect(map, c)
        if (s > bestScore) {
          bestScore = s
          best = c
          improved = true
        }
      }
    }
  }

  // Só aceita o refinamento se a pontuação melhorou de forma
  // significativa em relação ao ponto de partida (senão mantém a
  // posição original do guia — mais previsível que um ajuste
  // "aleatório" baseado em ruído da imagem).
  if (bestScore < initialScore * 1.15) {
    return initial
  }
  return best
}
