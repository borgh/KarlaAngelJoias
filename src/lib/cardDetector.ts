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

// Checagem LEVE, pra rodar ao vivo a cada frame da câmera (junto com
// a detecção de mão): o guia tracejado parece ter um cartão bem
// posicionado dentro? Compara a força de borda ao longo do perímetro
// do guia com a força média do interior — um cartão real bem
// encaixado tem bordas fortes no perímetro e interior relativamente
// uniforme; se a mão estiver cobrindo o cartão, ou se não tiver
// cartão nenhum ali (só a mesa), essa razão fica baixa.
//
// Usa uma resolução BEM menor que o refinamento pós-captura (160px de
// largura em vez de 320) — precisa ser rápido o bastante pra rodar
// dezenas de vezes por segundo sem travar a câmera.
export function checkCardInGuide(
  video: HTMLVideoElement,
  guide: CardRectState,
  scratchCanvas: HTMLCanvasElement
): { present: boolean; score: number } {
  const w = 160
  const h = Math.round((video.videoHeight / video.videoWidth) * w)
  if (!Number.isFinite(h) || h <= 0) return { present: false, score: 0 }
  scratchCanvas.width = w
  scratchCanvas.height = h
  const ctx = scratchCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { present: false, score: 0 }
  ctx.drawImage(video, 0, 0, w, h)
  const map = buildGradientMapFromCanvas(scratchCanvas)

  const rad = (guide.rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = guide.w / 2
  const hh = guide.h / 2
  const N = 12
  const toWorld = (lx: number, ly: number) => ({
    x: guide.cx + (lx * cos - ly * sin),
    y: guide.cy + (lx * sin + ly * cos),
  })

  // Amostra o perímetro do guia (onde a borda do cartão DEVERIA estar)
  // e um "anel" logo por FORA do guia (a mesa ao redor). Um cartão
  // real bem posicionado dá borda FORTE no perímetro e borda FRACA
  // logo fora (mesa lisa). Se a mão estiver cobrindo o cartão, a
  // borda do perímetro fica fraca/borrada E aparecem transições fora
  // do guia também (o contorno da mão) — a razão perímetro/fora cai.
  // Se não tiver cartão nenhum, os dois ficam fracos.
  //
  // Essa métrica é melhor que "perímetro / interior" (versão anterior)
  // porque não penaliza um cartão REALISTA cheio de chip/texto/logo
  // no miolo — o miolo pode ter textura à vontade, o que importa é o
  // contorno externo estar nítido e o entorno estar limpo.
  let perimeter = 0
  let outside = 0
  const OUT = 1.25 // anel externo a 25% além da borda
  // Também acumula por lado individualmente — a mão cobrindo o
  // cartão sempre "quebra" pelo menos uma borda inteira (por onde a
  // mão entra), enquanto um cartão só levemente torto mantém as 4
  // bordas todas fortes. Essa é a distinção que a razão global
  // sozinha não consegue fazer com segurança.
  const sideSums = [0, 0, 0, 0]
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1) - 0.5
    const sides = [
      [t * guide.w, -hh, t * guide.w, -hh * OUT],
      [t * guide.w, hh, t * guide.w, hh * OUT],
      [-hw, t * guide.h, -hw * OUT, t * guide.h],
      [hw, t * guide.h, hw * OUT, t * guide.h],
    ]
    sides.forEach(([lx, ly, ox, oy], sideIdx) => {
      const p = toWorld(lx, ly)
      const g = sampleGrad(map, p.x, p.y)
      perimeter += g
      sideSums[sideIdx] += g
      const o = toWorld(ox, oy)
      outside += sampleGrad(map, o.x, o.y)
    })
  }
  const perimeterAvg = perimeter / (N * 4)
  const outsideAvg = outside / (N * 4) || 1
  const weakestSideAvg = Math.min(...sideSums) / N

  // Três critérios, todos obrigatórios:
  //  1. Borda absoluta forte no perímetro (>= 25, escala Sobel 0-255)
  //  2. Perímetro bem mais forte que o entorno imediato (razão >= 2.5)
  //  3. NENHUM lado individual fraco (o mais fraco >= 15) — é isso
  //     que reprova "mão cobrindo o cartão" (uma borda inteira some)
  //     sem reprovar "cartão levemente torto" (todas continuam lá)
  // Limiares calibrados com teste sintético cobrindo: cartão liso,
  // cartão realista com chip/texto/logo, cartão torto (10°), mão
  // realista cobrindo metade do cartão, só a mesa, mão sem cartão.
  const score = perimeterAvg / outsideAvg
  return { present: perimeterAvg >= 25 && score >= 2.5 && weakestSideAvg >= 15, score }
}

// Versão do buildGradientMap que aceita um canvas já no tamanho
// desejado (sem re-escalar), pra reuso pela checagem ao vivo.
function buildGradientMapFromCanvas(canvas: HTMLCanvasElement): { data: Float32Array; w: number; h: number } {
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { data: rgba } = ctx.getImageData(0, 0, w, h)
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]
  }
  const grad = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1]
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
      grad[i] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return { data: grad, w, h }
}
