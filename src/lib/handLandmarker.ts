import type { FilesetResolver as FilesetResolverType, HandLandmarker as HandLandmarkerType } from '@mediapipe/tasks-vision'

let landmarkerPromise: Promise<HandLandmarkerType> | null = null

// Carrega o WASM + modelo do MediaPipe só na primeira vez que alguém
// realmente usa a câmera (não no carregamento do site) — evita baixar
// a biblioteca inteira (JS + modelo de IA) pra quem nunca vai usar
// essa ferramenta. import() dinâmico aqui é o que faz o bundler
// separar isso num arquivo à parte, carregado só sob demanda.
//
// Modo VIDEO (não IMAGE): detecta continuamente enquanto a câmera
// está aberta, quadro a quadro, em vez de só uma vez na foto parada —
// dá pra mostrar em tempo real se a mão foi encontrada, deixando a
// pessoa reposicionar ANTES de capturar, em vez de tirar a foto às
// cegas e só descobrir depois que não deu certo. Muito mais confiável
// na prática.
export function getHandLandmarker(): Promise<HandLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await (FilesetResolver as typeof FilesetResolverType).forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
      return (HandLandmarker as typeof HandLandmarkerType).createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        // Limites um pouco mais tolerantes que o padrão — em troca de
        // uma detecção ocasional a mais "generosa", ganhamos achar a
        // mão com mais frequência em fotos de ângulo/luz não-ideais
        // (o usuário ainda confirma/ajusta manualmente depois, então
        // um falso positivo aqui custa pouco).
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      })
    })()
  }
  return landmarkerPromise
}

// Índices dos pontos de referência da mão (padrão MediaPipe, 21 pontos).
//
// Cada dedo tem 4 pontos, do mais próximo da mão pro mais distante:
//   MCP (base, junta com a mão) → PIP (primeira dobra) → DIP → TIP (ponta)
//
// Um anel NÃO fica na base (MCP) — fica na falange proximal, ou seja,
// ENTRE a MCP e a PIP. Por isso o ponto de medição correto é o ponto
// médio entre esses dois landmarks, não a MCP sozinha (erro real
// encontrado em uso: as alcinhas ficavam na junta da base do dedo, na
// altura da palma, em vez de na altura onde o anel realmente é usado).
export const HAND_LANDMARKS = {
  WRIST: 0,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  RING_MCP: 13,
  RING_PIP: 14,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
} as const
