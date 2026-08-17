import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, RotateCcw, Smartphone, Sparkles as SparklesIcon } from 'lucide-react'
import { getHandLandmarker, HAND_LANDMARKS } from '../../lib/handLandmarker'
import { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../../lib/useCardCalibration'
import { diameterToResult, MIN_CIRCUMFERENCE_MM, MAX_CIRCUMFERENCE_MM } from '../../lib/ringSizeChart'
import { RingSizeResultCard } from './RingSizeResultCard'
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision'

type Stage = 'intro' | 'requesting' | 'live' | 'error' | 'captured'
type Finger = 'index' | 'middle' | 'ring' | 'pinky'

const FINGER_LANDMARK: Record<Finger, number> = {
  index: HAND_LANDMARKS.INDEX_MCP,
  middle: HAND_LANDMARKS.MIDDLE_MCP,
  ring: HAND_LANDMARKS.RING_MCP,
  pinky: HAND_LANDMARKS.PINKY_MCP,
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastResultRef = useRef<HandLandmarkerResult | null>(null)

  const [photoUrl, setPhotoUrl] = useState('')
  const [photoSize, setPhotoSize] = useState({ w: 0, h: 0 })
  const [cardRect, setCardRect] = useState({ x: CARD_GUIDE.x, y: CARD_GUIDE_TOP, w: CARD_GUIDE.width })
  const [fingerHandles, setFingerHandles] = useState({ left: 0.42, right: 0.58, y: 0.3 })
  const [autoDetected, setAutoDetected] = useState(false)
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
      const mcp = hand[FINGER_LANDMARK[finger]]
      const wrist = hand[HAND_LANDMARKS.WRIST]
      const handSpan = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y)
      const halfWidth = handSpan * 0.16
      setFingerHandles({ left: mcp.x - halfWidth, right: mcp.x + halfWidth, y: mcp.y })
      setAutoDetected(true)
    } else {
      setAutoDetected(false)
    }

    // Cartão: posição inicial = a mesma região do guia mostrado ao
    // vivo (a pessoa foi instruída a encaixar o cartão ali).
    setCardRect({ x: CARD_GUIDE.x, y: CARD_GUIDE_TOP, w: CARD_GUIDE.width })

    streamRef.current?.getTracks().forEach((t) => t.stop())
    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.92))
    setPhotoSize({ w: canvas.width, h: canvas.height })
    setStage('captured')
  }

  function retake() {
    setPhotoUrl('')
    setResult(null)
    setAutoDetected(false)
    startCamera()
  }

  function confirmMeasurement() {
    const cardWidthPx = cardRect.w * photoSize.w
    const pxPerMm = cardWidthPx / CARD_WIDTH_MM
    const fingerWidthPx = Math.abs(fingerHandles.right - fingerHandles.left) * photoSize.w
    const diameterMm = fingerWidthPx / pxPerMm
    const circumferenceMm = diameterMm * Math.PI

    if (
      !Number.isFinite(diameterMm) ||
      diameterMm <= 0 ||
      !photoSize.w ||
      circumferenceMm < MIN_CIRCUMFERENCE_MM ||
      circumferenceMm > MAX_CIRCUMFERENCE_MM
    ) {
      setErrorMsg(
        'O resultado ficou fora da faixa comum de anéis — confira se o retângulo do cartão e as alcinhas do dedo estão bem posicionados, ou tire outra foto.'
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
        <p className="max-w-sm text-[14px] text-ivory/70">
          Coloque a mão espalmada sobre uma mesa, com um <strong className="text-ivory">cartão de crédito/débito</strong> encostado
          ao lado do dedo — os dois na mesma superfície. Nossa IA acompanha sua mão em tempo real e avisa assim que
          conseguir localizar; você só confirma o ajuste fino depois.
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
    return (
      <div className="flex flex-col items-center gap-5">
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-black ring-2 transition-colors duration-300 ${
            handDetected ? 'ring-green-400' : 'ring-transparent'
          }`}
        >
          <video ref={videoRef} playsInline muted className="w-full" />
          <div
            className={`pointer-events-none absolute rounded-md border-2 border-dashed transition-colors duration-300 ${
              handDetected ? 'border-green-400' : 'border-gold/70'
            }`}
            style={{
              left: `${CARD_GUIDE.x * 100}%`,
              bottom: `${CARD_GUIDE.bottom * 100}%`,
              width: `${CARD_GUIDE.width * 100}%`,
              aspectRatio: `${CARD_WIDTH_MM} / ${CARD_HEIGHT_MM}`,
            }}
          />
          <div
            className={`absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-300 ${
              handDetected ? 'bg-green-500 text-white' : 'bg-ink/70 text-ivory/80'
            }`}
          >
            {handDetected ? (
              <>
                <CheckCircle2 size={13} /> Mão detectada
              </>
            ) : (
              'Posicione sua mão'
            )}
          </div>
        </div>
        <p className="max-w-xs text-center text-[12px] text-ivory/50">
          Encaixe o cartão dentro da guia tracejada e mantenha a mão espalmada visível
          {!handDetected && ' — aguarde o indicador ficar verde antes de capturar.'}
        </p>
        {errorMsg && <p className="text-[13px] text-garnet">{errorMsg}</p>}
        <button
          onClick={capture}
          className="flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright"
        >
          <Camera size={16} /> Capturar foto
        </button>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-sm select-none overflow-hidden rounded-2xl">
        <img src={photoUrl} alt="Foto capturada" className="w-full" draggable={false} />

        <DraggableBox
          xFrac={cardRect.x}
          yFrac={cardRect.y}
          widthFrac={cardRect.w}
          heightFrac={cardRect.w * (CARD_HEIGHT_MM / CARD_WIDTH_MM)}
          onMove={(x, y) => setCardRect((r) => ({ ...r, x, y }))}
          label="Cartão"
          color="border-gold"
        />

        <FingerHandles
          left={fingerHandles.left}
          right={fingerHandles.right}
          y={fingerHandles.y}
          onChange={setFingerHandles}
        />
      </div>

      <input
        type="range"
        min={0.15}
        max={0.6}
        step={0.005}
        value={cardRect.w}
        onChange={(e) => setCardRect((r) => ({ ...r, w: Number(e.target.value) }))}
        className="w-full max-w-xs accent-gold"
        aria-label="Ajustar tamanho do retângulo do cartão"
      />
      <p className="text-center text-[12px] text-ivory/50">
        {autoDetected
          ? 'IA localizou sua mão — ajuste as alcinhas amarelas até a borda real do dedo, e o retângulo dourado até a borda do cartão.'
          : 'Não conseguimos localizar a mão automaticamente — posicione as alcinhas e o retângulo manualmente.'}
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

function DraggableBox({
  xFrac,
  yFrac,
  widthFrac,
  heightFrac,
  onMove,
  label,
  color,
}: {
  xFrac: number
  yFrac: number
  widthFrac: number
  heightFrac: number
  onMove: (x: number, y: number) => void
  label: string
  color: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const parent = ref.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const x = Math.min(1 - widthFrac, Math.max(0, (e.clientX - rect.left) / rect.width - widthFrac / 2))
    const y = Math.min(1 - heightFrac, Math.max(0, (e.clientY - rect.top) / rect.height - heightFrac / 2))
    onMove(x, y)
  }
  function handlePointerUp() {
    dragging.current = false
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute cursor-move touch-none rounded-md border-2 bg-black/10 ${color}`}
      style={{
        left: `${xFrac * 100}%`,
        top: `${yFrac * 100}%`,
        width: `${widthFrac * 100}%`,
        height: `${heightFrac * 100}%`,
      }}
    >
      <span className="absolute -top-5 left-0 text-[10px] font-semibold uppercase tracking-wide text-gold">
        {label}
      </span>
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
      {/* linha horizontal conectando as duas alças */}
      <div
        onPointerDown={(e) => {
          draggingHandle.current = 'line'
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        className="absolute h-0.5 cursor-ns-resize bg-red-400"
        style={{ left: `${left * 100}%`, right: `${(1 - right) * 100}%`, top: `${y * 100}%`, pointerEvents: 'auto' }}
      />
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
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-red-400 bg-red-400/40"
          style={{ left: `${h.x * 100}%`, top: `${y * 100}%`, pointerEvents: 'auto' }}
        />
      ))}
    </div>
  )
}
