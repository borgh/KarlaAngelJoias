// Encontra a largura REAL do dedo (não mais um chute proporcional
// fixo) — varre uma linha perpendicular ao eixo do dedo, ancorada no
// ponto que o MediaPipe já localizou (a base do dedo escolhido), e
// procura onde o gradiente de intensidade é mais forte de cada lado
// — esse pico corresponde à borda real do dedo (transição pele →
// fundo), não uma suposição.
//
// Mesma filosofia do detector de cartão (src/lib/cardDetector.ts):
// busca local, ancorada numa posição já confiável (aqui, o landmark
// do MediaPipe; lá, o guia mostrado na câmera) — muito mais tratável
// e confiável que tentar "adivinhar" a imagem inteira do zero.

export type FingerEdgeResult = { widthFrac: number; confidence: number }

const DOWNSCALE_WIDTH = 480

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

function sample(map: { data: Float32Array; w: number; h: number }, xFrac: number, yFrac: number): number {
  const x = Math.round(xFrac * map.w)
  const y = Math.round(yFrac * map.h)
  if (x < 0 || x >= map.w || y < 0 || y >= map.h) return 0
  return map.data[y * map.w + x]
}

/**
 * @param canvas Foto capturada (resolução real)
 * @param centerXFrac,centerYFrac Ponto de partida (landmark MCP do MediaPipe), em frações 0-1
 * @param directionRad Ângulo do EIXO do dedo (a função calcula a perpendicular internamente)
 * @param initialHalfWidthFrac Meia-largura inicial (heurística antiga), define o tamanho da janela de busca
 */
export function refineFingerEdges(
  canvas: HTMLCanvasElement,
  centerXFrac: number,
  centerYFrac: number,
  directionRad: number,
  initialHalfWidthFrac: number
): FingerEdgeResult {
  const map = buildGradientMap(canvas)

  const perpRad = directionRad + Math.PI / 2
  const px = Math.cos(perpRad)
  const py = Math.sin(perpRad)

  const range = initialHalfWidthFrac * 2.2
  const STEPS = 80
  const profile: number[] = []
  for (let i = 0; i <= STEPS; i++) {
    const t = (i / STEPS) * 2 * range - range
    profile.push(sample(map, centerXFrac + px * t, centerYFrac + py * t))
  }

  const mid = STEPS / 2
  function findPeak(from: number, to: number): { index: number; value: number } {
    let bestIdx = from
    let bestVal = -Infinity
    for (let i = from; i <= to; i++) {
      if (profile[i] > bestVal) {
        bestVal = profile[i]
        bestIdx = i
      }
    }
    return { index: bestIdx, value: bestVal }
  }
  const leftPeak = findPeak(0, Math.floor(mid))
  const rightPeak = findPeak(Math.ceil(mid), STEPS)

  function indexToT(i: number) {
    return (i / STEPS) * 2 * range - range
  }
  const leftT = indexToT(leftPeak.index)
  const rightT = indexToT(rightPeak.index)

  const leftPoint = { x: centerXFrac + px * leftT, y: centerYFrac + py * leftT }
  const rightPoint = { x: centerXFrac + px * rightT, y: centerYFrac + py * rightT }

  const avgProfile = profile.reduce((a, b) => a + b, 0) / profile.length || 1
  const confidence = Math.min(1, (leftPeak.value + rightPeak.value) / 2 / (avgProfile * 4))

  // Distância euclidiana real entre as duas bordas encontradas — não
  // só a diferença em X, porque se o dedo estiver em ângulo na foto,
  // as duas bordas têm X *e* Y diferentes; usar só a diferença em X
  // subestimaria a largura real. A interface (CameraTab) usa esse
  // valor como largura, mas continua desenhando a linha das alcinhas
  // na horizontal — simplificação deliberada, ver comentário em
  // CameraTab.tsx.
  const widthFrac = Math.hypot(rightPoint.x - leftPoint.x, rightPoint.y - leftPoint.y)

  return { widthFrac, confidence }
}
