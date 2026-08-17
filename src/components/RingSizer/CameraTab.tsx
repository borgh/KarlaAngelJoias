import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, GripHorizontal, RotateCcw, Smartphone, Sparkles as SparklesIcon } from 'lucide-react'
import { getHandLandmarker, HAND_LANDMARKS } from '../../lib/handLandmarker'
import { refineCardRect, checkCardInGuide } from '../../lib/cardDetector'
import { refineFingerEdges } from '../../lib/fingerEdgeDetector'
import { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../../lib/useCardCalibration'
import { diameterToResult, MIN_CIRCUMFERENCE_MM, MAX_CIRCUMFERENCE_MM } from '../../lib/ringSizeChart'
import { RingSizeResultCard } from './RingSizeResultCard'
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision'

type Stage = 'intro' | 'requesting' | 'live' | 'error' | 'captured'
type Finger = 'index' | 'middle' | 'ring' | 'pinky'

const FINGER_LANDMARKS: Record<Finger, { mcp: number; pip: number }> = {
  index: { mcp: HAND_LANDMARKS.INDEX_MCP, pip: HAND_LANDMARKS.INDEX_PIP },
  middle: { mcp: HAND_LANDMARKS.MIDDLE_MCP, pip: HAND_LANDMARKS.MIDDLE_PIP },
  ring: { mcp: HAND_LANDMARKS.RING_MCP, pip: HAND_LANDMARKS.RING_PIP },
  pinky: { mcp: HAND_LANDMARKS.PINKY_MCP, pip: HAND_LANDMARKS.PINKY_PIP },
}
const FINGER_LABEL: Record<Finger, string> = {
  index: 'Indicador',
  middle: 'Médio',
  ring: 'Anelar',
  pinky: 'Mindinho',
}

// Região do guia de cartão mostrado na câmera ao vivo — as mesmas
// coordenadas são usadas como posição INICIAL do retângulo de
// calibração depois de capturar a foto. Já que a pessoa foi
// instruída a encaixar o cartão real bem ali, começar o ajuste
// exatamente nessa posição (em vez de um valor genérico no centro) é
// um "auto-posicionamento" confiável sem precisar de detecção de
// objeto por IA — aproveita a própria instrução dada ao usuário.
const CARD_GUIDE = {
  x: 0.25,
  width: 0.5,
  bottom: 0.1,
}
const CARD_GUIDE_HEIGHT = CARD_GUIDE.width * (CARD_HEIGHT_MM / CARD_WIDTH_MM)
const CARD_GUIDE_TOP = 1 - CARD_GUIDE.bottom - CARD_GUIDE_HEIGHT

export function CameraTab() {
  const [stage, setStage] = useState<Stage>('intro')
  const [errorMsg, setErrorMsg] = useState('')
  const [finger, setFinger] = useState<Finger>('ring')
  const [handDetected, setHandDetected] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastResultRef = useRef<HandLandmarkerResult | null>(null)

  const [photoUrl, setPhotoUrl] = useState('')
  const [photoSize, setPhotoSize] = useState({ w: 0, h: 0 })
  const [cardRect, setCardRect] = useState({
    cx: CARD_GUIDE.x + CARD_GUIDE.width / 2,
    cy: CARD_GUIDE_TOP + CARD_GUIDE_HEIGHT / 2,
    w: CARD_GUIDE.width,
    h: CARD_GUIDE_HEIGHT,
    rotationDeg: 0,
  })
  const [fingerHandles, setFingerHandles] = useState({ left: 0.42, right: 0.58, y: 0.3 })
  const [autoDetected, setAutoDetected] = useState(false)
  const [fingerEdgeConfident, setFingerEdgeConfident] = useState(false)
  const [cardAutoRefined, setCardAutoRefined] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof diameterToResult> | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // O elemento <video> só existe no DOM quando stage === 'live' — se
  // tentássemos conectar o stream nele durante a espera de permissão
  // (stage === 'requesting'), o elemento ainda nem existiria (bug
  // real encontrado em teste: videoWidth ficava 0 pra sempre). Esse
  // efeito conecta o stream assim que o elemento realmente existe, e
  // dispara a detecção contínua de mão em tempo real.
  useEffect(() => {
    if (stage !== 'live' || !videoRef.current || !streamRef.current) return
    const video = videoRef.current
    video.srcObject = streamRef.current
    video.play().catch(() => {})

    let cancelled = false
    getHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return
        let frameCounter = 0
        const loop = () => {
          if (cancelled || !videoRef.current) return
          if (videoRef.current.videoWidth > 0) {
            try {
              const result = landmarker.detectForVideo(videoRef.current, performance.now())
              lastResultRef.current = result
              setHandDetected((result.landmarks?.length ?? 0) > 0)
            } catch {
              // Frame ocasional pode falhar (câmera ainda ajustando) — sem problema, tenta de novo no próximo.
            }

            // Checagem do cartão a cada 3 frames (não precisa ser a
            // cada frame — é o suficiente pra reagir rápido e não
            // sobrecarrega o processamento junto com a detecção de mão).
            frameCounter++
            if (frameCounter % 3 === 0) {
              try {
                if (!scratchCanvasRef.current) scratchCanvasRef.current = document.createElement('canvas')
                const guide = {
                  cx: CARD_GUIDE.x + CARD_GUIDE.width / 2,
                  cy: CARD_GUIDE_TOP + CARD_GUIDE_HEIGHT / 2,
                  w: CARD_GUIDE.width,
                  h: CARD_GUIDE_HEIGHT,
                  rotationDeg: 0,
                }
                const check = checkCardInGuide(videoRef.current, guide, scratchCanvasRef.current)
                setCardReady(check.present)
              } catch {
                // idem — frame ruim, tenta no próximo
              }
            }
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      })
      .catch(() => {
        // Sem IA disponível (rede, navegador sem suporte a WASM) — a
        // captura continua funcionando normalmente, só sem a
        // detecção ao vivo; cai pro ajuste 100% manual depois.
      })

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [stage])

  async function startCamera() {
    setStage('requesting')
    setErrorMsg('')
    setHandDetected(false)
    setCardReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      })
      streamRef.current = stream
      setStage('live')
    } catch {
      setErrorMsg(
        'Não foi possível acessar a câmera — verifique se você permitiu o acesso, ou use um dos outros dois métodos.'
      )
      setStage('error')
    }
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMsg('A câmera ainda está inicializando — aguarde um instante e tente capturar de novo.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Usa a última detecção da câmera AO VIVO (já rodando em segundo
    // plano) em vez de rodar a IA de novo na foto parada — mais
    // rápido, e reaproveita exatamente o que a pessoa já viu
    // confirmado como "mão detectada" antes de tirar a foto.
    const hand = lastResultRef.current?.landmarks?.[0]
    if (hand) {
      const { mcp: mcpIdx, pip: pipIdx } = FINGER_LANDMARKS[finger]
      const mcp = hand[mcpIdx]
      const pip = hand[pipIdx]

      // Ponto de medição = meio da falange proximal (entre a base do
      // dedo e a primeira dobra) — é onde um anel de fato fica.
      // Antes usava só a MCP (base), o que colocava as alcinhas na
      // altura da palma da mão (bug real visto em uso).
      const measureX = (mcp.x + pip.x) / 2
      const measureY = (mcp.y + pip.y) / 2

      // Direção do dedo = vetor MCP→PIP (o eixo real da falange que
      // estamos medindo), não mais pulso→base (que segue a orientação
      // geral da mão, e pode divergir do dedo em si se ele estiver
      // afastado dos outros).
      const directionRad = Math.atan2(pip.y - mcp.y, pip.x - mcp.x)

      // Chute inicial da meia-largura, proporcional ao comprimento da
      // falange (dedos mais longos costumam ser mais grossos) —
      // serve só como tamanho de janela pra busca de borda abaixo.
      const phalanxLen = Math.hypot(pip.x - mcp.x, pip.y - mcp.y)
      const heuristicHalfWidth = phalanxLen * 0.42

      // Mede a borda REAL varrendo perpendicular ao dedo (ver
      // src/lib/fingerEdgeDetector.ts). Só usa se a confiança for
      // razoável; senão cai pro chute — mais previsível que confiar
      // numa detecção ambígua.
      const edgeResult = refineFingerEdges(canvas, measureX, measureY, directionRad, heuristicHalfWidth)
      const halfWidth = edgeResult.confidence > 0.5 ? edgeResult.widthFrac / 2 : heuristicHalfWidth

      setFingerHandles({ left: measureX - halfWidth, right: measureX + halfWidth, y: measureY })
      setAutoDetected(true)
      setFingerEdgeConfident(edgeResult.confidence > 0.5)
    } else {
      setAutoDetected(false)
      setFingerEdgeConfident(false)
    }

    // Cartão: começa na mesma região do guia mostrado ao vivo (a
    // pessoa foi instruída a encaixar o cartão ali).
    const guessedCardRect = {
      cx: CARD_GUIDE.x + CARD_GUIDE.width / 2,
      cy: CARD_GUIDE_TOP + CARD_GUIDE_HEIGHT / 2,
      w: CARD_GUIDE.width,
      h: CARD_GUIDE_HEIGHT,
      rotationDeg: 0,
    }

    // Se a checagem AO VIVO (checkCardInGuide, rodando quadro a
    // quadro na pré-visualização) já confirmou que o cartão estava
    // bem encaixado no guia — ou seja, o indicador "Cartão" já tinha
    // ficado verde antes de capturar — usa essa posição diretamente,
    // SEM rodar o refinamento pós-captura de novo.
    //
    // Por quê: o refinamento pós-captura (refineCardRect, busca em
    // grade + coordinate descent) é sabidamente imperfeito — já
    // documentado que não converge perfeito de forma confiável (ver
    // docs/features/medidor-de-anel.md). Rodar essa busca imperfeita
    // por cima de uma posição que a checagem ao vivo JÁ confirmou como
    // correta só cria risco de desalinhar algo que já estava certo
    // (bug real relatado: cartão bem posicionado na câmera ao vivo,
    // mas o quadro saía errado depois de capturar — exatamente esse
    // problema). O refinamento pós-captura continua existindo como
    // reserva pra quando NÃO tivemos essa confirmação ao vivo — nesse
    // caso, uma busca imperfeita ainda é melhor que nenhuma tentativa.
    if (cardReady) {
      setCardRect(guessedCardRect)
      setCardAutoRefined(true)
    } else {
      const refined = refineCardRect(canvas, guessedCardRect)
      setCardRect(refined)
      setCardAutoRefined(refined !== guessedCardRect)
    }

    streamRef.current?.getTracks().forEach((t) => t.stop())
    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.92))
    setPhotoSize({ w: canvas.width, h: canvas.height })
    setStage('captured')
  }

  function retake() {
    setPhotoUrl('')
    setResult(null)
    setAutoDetected(false)
    setFingerEdgeConfident(false)
    setCardAutoRefined(false)
    startCamera()
  }

  function confirmMeasurement() {
    const cardWidthPx = cardRect.w * photoSize.w
    const pxPerMm = cardWidthPx / CARD_WIDTH_MM
    const fingerWidthPx = Math.abs(fingerHandles.right - fingerHandles.left) * photoSize.w
    const diameterMm = fingerWidthPx / pxPerMm
    const circumferenceMm = diameterMm * Math.PI

    if (!Number.isFinite(diameterMm) || diameterMm <= 0 || !photoSize.w) {
      setErrorMsg(
        'Não deu pra calcular a partir dessa foto — confira se o quadro do cartão e as alcinhas do dedo estão bem posicionados.'
      )
      return
    }

    if (circumferenceMm < MIN_CIRCUMFERENCE_MM || circumferenceMm > MAX_CIRCUMFERENCE_MM) {
      const tooSmall = circumferenceMm < MIN_CIRCUMFERENCE_MM
      setErrorMsg(
        `O valor calculado (${circumferenceMm.toFixed(0)}mm de circunferência) ficou ${tooSmall ? 'menor' : 'maior'} do que qualquer anel comum. ` +
          (tooSmall
            ? 'As alcinhas provavelmente estão perto demais uma da outra, ou o quadro do cartão está maior do que o cartão de verdade na foto.'
            : 'As alcinhas provavelmente estão longe demais uma da outra, ou o quadro do cartão está menor do que o cartão de verdade na foto.') +
          ' Confira também se as duas bolinhas estão mesmo em cima de um dedo esticado e visível — não sobre a palma ou fora da mão.'
      )
      return
    }
    setErrorMsg('')
    setResult(diameterToResult(diameterMm))
  }

  if (result) {
    return (
      <RingSizeResultCard
        result={result}
        onReset={() => {
          setResult(null)
          setStage('intro')
        }}
      />
    )
  }

  if (stage === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <SparklesIcon className="text-gold" size={28} />

        {/* Diagrama esquemático — vista de CIMA da mão numa mesa, não
            a palma virada de frente pra câmera (erro comum: segurar a
            mão levantada olhando pro celular, em vez de deitar a mão
            e fotografar de cima olhando pra baixo). */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-ivory/10 bg-ink-soft/40 px-6 py-5">
          <svg width="180" height="140" viewBox="0 0 180 140" className="text-ivory/70">
            {/* mesa */}
            <rect x="4" y="4" width="172" height="132" rx="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
            {/* mão espalmada, vista de cima */}
            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M60 100 Q55 60 60 40" />
              <path d="M75 100 Q72 45 76 22" />
              <path d="M90 100 Q90 42 90 20" />
              <path d="M105 100 Q108 45 104 25" />
              <path d="M120 100 Q126 65 118 48" />
              <path d="M55 100 Q90 118 125 100" />
            </g>
            {/* cartão ao lado de um dedo */}
            <rect x="66" y="52" width="18" height="30" rx="2" fill="#C89A4C" opacity="0.85" />
            {/* câmera acima, olhando pra baixo */}
            <g transform="translate(90, 8)">
              <circle r="6" fill="none" stroke="#C89A4C" strokeWidth="2" />
              <path d="M0 6 L0 14" stroke="#C89A4C" strokeWidth="2" />
            </g>
          </svg>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
            Câmera de cima olhando pra baixo — não a palma de frente pro celular
          </p>
        </div>

        <p className="max-w-sm text-[14px] text-ivory/70">
          Deite a mão numa mesa, <strong className="text-ivory">com a palma pra cima e os dedos esticados</strong>{' '}
          (não dobrados), e fotografe de cima olhando pra baixo — como no desenho acima. Encoste um{' '}
          <strong className="text-ivory">cartão de crédito/débito</strong> ao lado do dedo, na mesma mesa. Nossa IA
          acompanha sua mão em tempo real e avisa assim que conseguir localizar.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(FINGER_LABEL) as Finger[]).map((f) => (
            <button
              key={f}
              onClick={() => setFinger(f)}
              className={`rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                finger === f ? 'border-gold bg-gold text-ink' : 'border-ivory/20 text-ivory/60'
              }`}
            >
              {FINGER_LABEL[f]}
            </button>
          ))}
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright"
        >
          <Camera size={16} /> Abrir câmera
        </button>
        <div className="flex max-w-sm items-start gap-2 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-left">
          <Smartphone size={16} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-[12px] leading-relaxed text-ivory/70">
            <strong className="text-ivory">Use o celular para melhor resultado.</strong> No computador, a câmera
            costuma ser frontal e de baixa qualidade — dificulta enquadrar a mão numa mesa. Pelo celular, use a
            câmera traseira e apoie o aparelho de forma estável antes de capturar.
          </p>
        </div>
        <p className="text-[11px] text-ivory/35">
          A foto nunca sai do seu aparelho — a análise roda 100% no seu navegador.
        </p>
      </div>
    )
  }

  if (stage === 'requesting') {
    return <p className="text-center text-ivory/60">Solicitando acesso à câmera…</p>
  }

  if (stage === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="max-w-sm text-[14px] text-garnet">{errorMsg}</p>
        <button
          onClick={startCamera}
          className="rounded-full border border-ivory/20 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ivory/70 hover:border-gold hover:text-gold"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (stage === 'live') {
    const allReady = handDetected && cardReady
    return (
      <div className="flex flex-col items-center gap-5">
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-black ring-2 transition-colors duration-300 ${
            allReady ? 'ring-green-400' : 'ring-transparent'
          }`}
        >
          <video ref={videoRef} playsInline muted className="w-full" />
          {/* Guia do cartão — fica VERDE só quando o cartão é detectado
              dentro dele (não coberto pela mão, bordas visíveis). */}
          <div
            className={`pointer-events-none absolute rounded-md border-2 border-dashed transition-colors duration-300 ${
              cardReady ? 'border-green-400' : 'border-gold/70'
            }`}
            style={{
              left: `${CARD_GUIDE.x * 100}%`,
              bottom: `${CARD_GUIDE.bottom * 100}%`,
              width: `${CARD_GUIDE.width * 100}%`,
              aspectRatio: `${CARD_WIDTH_MM} / ${CARD_HEIGHT_MM}`,
            }}
          />

          {/* Dois indicadores separados — a pessoa vê exatamente O QUE
              ainda falta ajustar (mão? cartão? os dois?), em vez de um
              único "verde/não-verde" sem explicação. */}
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 ${
                handDetected ? 'bg-green-500 text-white' : 'bg-ink/70 text-ivory/70'
              }`}
            >
              {handDetected ? <CheckCircle2 size={12} /> : <span className="h-3 w-3 rounded-full border border-ivory/50" />}
              Mão
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 ${
                cardReady ? 'bg-green-500 text-white' : 'bg-ink/70 text-ivory/70'
              }`}
            >
              {cardReady ? <CheckCircle2 size={12} /> : <span className="h-3 w-3 rounded-full border border-ivory/50" />}
              Cartão
            </span>
          </div>
        </div>

        <p className="max-w-xs text-center text-[12px] text-ivory/50">
          {allReady
            ? '✅ Mão e cartão detectados — pode capturar.'
            : !handDetected && !cardReady
              ? 'Dedos esticados, palma pra cima, câmera de cima. Encaixe o cartão dentro do guia tracejado, sem cobrir com a mão.'
              : !handDetected
                ? 'Cartão OK. Agora deixe a mão espalmada, dedos esticados, bem visível.'
                : 'Mão OK. Agora encaixe o cartão dentro do guia tracejado, sem a mão em cima dele.'}
        </p>
        {errorMsg && <p className="text-[13px] text-garnet">{errorMsg}</p>}
        <button
          onClick={capture}
          className={`flex items-center gap-2 rounded-full px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
            allReady
              ? 'bg-green-500 text-white hover:bg-green-400'
              : 'bg-gold text-ink hover:bg-gold-bright'
          }`}
        >
          <Camera size={16} /> {allReady ? 'Capturar agora' : 'Capturar foto'}
        </button>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-sm select-none overflow-hidden rounded-2xl">
        <img src={photoUrl} alt="Foto capturada" className="w-full" draggable={false} />

        <DraggableCard rect={cardRect} onChange={setCardRect} label="Cartão" />

        <FingerHandles
          left={fingerHandles.left}
          right={fingerHandles.right}
          y={fingerHandles.y}
          onChange={setFingerHandles}
        />
      </div>

      <div className="w-full max-w-sm space-y-3 rounded-xl border border-ivory/10 bg-ivory/5 p-4 text-left">
        <p className="flex items-start gap-2 text-[12px] leading-relaxed text-gold">
          <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 border-gold" />
          <span>
            <strong>Quadro dourado (cartão)</strong> — arraste pelo meio pra mover, pelo <strong>canto</strong> pra
            redimensionar livremente, e pela <strong>alça de cima</strong> pra girar até acompanhar a inclinação real
            do cartão na foto. Encaixe nas 4 bordas.
          </span>
        </p>
        <p className="flex items-start gap-2 text-[12px] leading-relaxed text-red-300">
          <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-red-400" />
          <span>
            <strong>Bolinhas vermelhas</strong> — o <strong>centro da cruz</strong> (não a bolinha inteira) marca o
            ponto exato. Arraste cada uma até o centro da cruz tocar a <strong>borda lateral do dedo</strong> (a
            largura dele, não a ponta). Pra subir ou descer o par inteiro de uma vez (sem perder o espaçamento
            entre elas), arraste a <strong className="text-gold">alça dourada</strong> no meio da linha.
          </span>
        </p>
      </div>

      <p className="text-center text-[12px] text-ivory/50">
        {autoDetected && fingerEdgeConfident && cardAutoRefined
          ? '✅ IA localizou a mão, a borda do dedo e o cartão automaticamente. Confira se ficou certo antes de confirmar.'
          : autoDetected && fingerEdgeConfident
            ? 'IA localizou a mão e mediu a borda real do dedo. '
            : autoDetected
              ? 'IA localizou a mão, mas não teve certeza da borda do dedo — confira as alcinhas com atenção. '
              : 'Não conseguimos localizar a mão automaticamente — posicione as alcinhas manualmente. '}
        {!(autoDetected && fingerEdgeConfident && cardAutoRefined) &&
          (cardAutoRefined
            ? 'O quadro do cartão foi encaixado automaticamente.'
            : 'Ajuste o quadro do cartão manualmente até encaixar nas 4 bordas.')}
      </p>
      {errorMsg && <p className="max-w-sm text-center text-[13px] text-garnet">{errorMsg}</p>}

      <div className="flex gap-3">
        <button
          onClick={confirmMeasurement}
          className="rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright"
        >
          Confirmar medida
        </button>
        <button
          onClick={retake}
          className="flex items-center gap-2 rounded-full border border-ivory/20 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ivory/60 hover:border-gold hover:text-gold"
        >
          <RotateCcw size={14} /> Tirar outra
        </button>
      </div>
    </div>
  )
}

// Quadro do cartão: move (arrastar o corpo), redimensiona livremente
// (arrastar o canto inferior direito — largura e altura totalmente
// independentes, sem proporção travada) e gira (arrastar a alça
// acima do centro) — necessário porque na prática as pessoas
// fotografam o cartão segurando na mão, num ângulo, não perfeitamente
// alinhado com a câmera; um retângulo fixo sem rotação nunca encaixa
// nesses casos.
//
// Toda a matemática de arrastar acontece em PIXELS reais do
// contêiner (não em frações soltas) — evita distorção quando a foto
// não é quadrada.
type CardRectState = { cx: number; cy: number; w: number; h: number; rotationDeg: number }

function DraggableCard({
  rect,
  onChange,
  label,
}: {
  rect: CardRectState
  onChange: (r: CardRectState) => void
  label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mode = useRef<'move' | 'resize' | 'rotate' | null>(null)
  const startRef = useRef({ pointerX: 0, pointerY: 0, rect })

  function getContainerRect() {
    return containerRef.current?.parentElement?.getBoundingClientRect() ?? null
  }

  function beginDrag(e: React.PointerEvent, m: 'move' | 'resize' | 'rotate') {
    e.stopPropagation()
    mode.current = m
    startRef.current = { pointerX: e.clientX, pointerY: e.clientY, rect }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!mode.current) return
    const container = getContainerRect()
    if (!container) return
    const start = startRef.current
    const dxPx = e.clientX - start.pointerX
    const dyPx = e.clientY - start.pointerY

    if (mode.current === 'move') {
      onChange({
        ...start.rect,
        cx: Math.min(1, Math.max(0, start.rect.cx + dxPx / container.width)),
        cy: Math.min(1, Math.max(0, start.rect.cy + dyPx / container.height)),
      })
      return
    }

    if (mode.current === 'resize') {
      // Converte o deslocamento do mouse (em pixels de tela) pro
      // referencial LOCAL do retângulo (que pode estar girado) —
      // sem isso, redimensionar um cartão girado puxaria pro lado
      // errado.
      const rad = (-start.rect.rotationDeg * Math.PI) / 180
      const localDx = dxPx * Math.cos(rad) - dyPx * Math.sin(rad)
      const localDy = dxPx * Math.sin(rad) + dyPx * Math.cos(rad)
      const newW = Math.min(0.9, Math.max(0.08, start.rect.w + (localDx / container.width) * 2))
      const newH = Math.min(0.9, Math.max(0.08, start.rect.h + (localDy / container.height) * 2))
      onChange({ ...start.rect, w: newW, h: newH })
      return
    }

    // rotate
    const centerPx = { x: start.rect.cx * container.width + container.left, y: start.rect.cy * container.height + container.top }
    const angle = (Math.atan2(e.clientX - centerPx.x, -(e.clientY - centerPx.y)) * 180) / Math.PI
    onChange({ ...start.rect, rotationDeg: angle })
  }

  function handlePointerUp() {
    mode.current = null
  }

  const style: React.CSSProperties = {
    left: `${rect.cx * 100}%`,
    top: `${rect.cy * 100}%`,
    width: `${rect.w * 100}%`,
    height: `${rect.h * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rect.rotationDeg}deg)`,
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute touch-none cursor-move rounded-md border-2 border-gold bg-black/10"
      style={style}
      onPointerDown={(e) => beginDrag(e, 'move')}
    >
      <span className="pointer-events-none absolute -top-5 left-0 text-[10px] font-semibold uppercase tracking-wide text-gold">
        {label}
      </span>

      {/* alça de rotação */}
      <div
        onPointerDown={(e) => beginDrag(e, 'rotate')}
        className="absolute left-1/2 top-0 flex h-6 w-6 -translate-x-1/2 -translate-y-[150%] cursor-grab items-center justify-center rounded-full border-2 border-gold bg-ink"
      >
        <RotateCcw size={12} className="text-gold" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-0 h-[50%] w-px -translate-x-1/2 -translate-y-full bg-gold/50" />

      {/* alça de redimensionar (canto inferior direito) */}
      <div
        onPointerDown={(e) => beginDrag(e, 'resize')}
        className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-gold bg-ink"
      />
    </div>
  )
}

function FingerHandles({
  left,
  right,
  y,
  onChange,
}: {
  left: number
  right: number
  y: number
  onChange: (v: { left: number; right: number; y: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingHandle = useRef<'left' | 'right' | 'line' | null>(null)

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingHandle.current) return
    const parent = containerRef.current
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const xFrac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const yFrac = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    if (draggingHandle.current === 'left') onChange({ left: xFrac, right, y })
    else if (draggingHandle.current === 'right') onChange({ left, right: xFrac, y })
    else onChange({ left, right, y: yFrac })
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      style={{ pointerEvents: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => (draggingHandle.current = null)}
    >
      {/* Linha fina vermelha — só visual, conecta as duas bolinhas
          (não interativa, pra não competir com a área de clique
          delas — ver alça de arrastar abaixo). */}
      <div
        className="pointer-events-none absolute h-0.5 -translate-y-1/2 bg-red-400"
        style={{ left: `${left * 100}%`, right: `${(1 - right) * 100}%`, top: `${y * 100}%` }}
      />

      {/* Alça de arrastar VERTICAL — move o par inteiro (as duas
          bolinhas juntas, mantendo a distância entre elas) pra cima/
          baixo, pra encaixar na altura certa do dedo. Fica deslocada
          ABAIXO da linha (não em cima dela) de propósito — se ficasse
          na mesma posição das bolinhas, a área de clique maior delas
          (pra facilitar tocar no celular) acaba competindo/
          sobrepondo o espaço da alça quando as bolinhas estão
          próximas uma da outra, dificultando ou impedindo o
          arrastar vertical (bug real encontrado em teste). */}
      <div
        onPointerDown={(e) => {
          draggingHandle.current = 'line'
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        className="absolute flex -translate-x-1/2 cursor-ns-resize flex-col items-center"
        style={{ left: `${((left + right) / 2) * 100}%`, top: `${y * 100}%`, pointerEvents: 'auto' }}
      >
        <div className="pointer-events-none h-4 w-px bg-red-400/60" />
        <div className="pointer-events-none flex h-7 w-11 animate-pulse items-center justify-center rounded-full border-2 border-ivory bg-gold shadow-lg">
          <GripHorizontal size={16} className="text-ink" strokeWidth={2.5} />
        </div>
      </div>
      {[
        { key: 'left' as const, x: left },
        { key: 'right' as const, x: right },
      ].map((h) => (
        <div
          key={h.key}
          onPointerDown={(e) => {
            draggingHandle.current = h.key
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          }}
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
          style={{ left: `${h.x * 100}%`, top: `${y * 100}%`, pointerEvents: 'auto' }}
        >
          {/* Mira vazada — sem preenchimento sólido, pra não tampar a
              vista da borda real do dedo bem no ponto que importa.
              Anel branco externo (contraste em qualquer tom de pele) +
              anel vermelho interno mais fino + cruz central marcando o
              ponto exato. */}
          <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/95 drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]" />
          <div className="pointer-events-none absolute inset-[6px] rounded-full border-2 border-red-500" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-white" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white" />
        </div>
      ))}
    </div>
  )
}
