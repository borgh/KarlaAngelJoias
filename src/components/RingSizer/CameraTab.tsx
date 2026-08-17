import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCcw, Sparkles as SparklesIcon } from 'lucide-react'
import { getHandLandmarker, HAND_LANDMARKS } from '../../lib/handLandmarker'
import { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../../lib/useCardCalibration'
import { diameterToResult, MIN_CIRCUMFERENCE_MM, MAX_CIRCUMFERENCE_MM } from '../../lib/ringSizeChart'
import { RingSizeResultCard } from './RingSizeResultCard'

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

export function CameraTab() {
  const [stage, setStage] = useState<Stage>('intro')
  const [errorMsg, setErrorMsg] = useState('')
  const [finger, setFinger] = useState<Finger>('ring')
  const [modelLoading, setModelLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [photoUrl, setPhotoUrl] = useState('')
  const [photoSize, setPhotoSize] = useState({ w: 0, h: 0 })
  const [cardRect, setCardRect] = useState({ x: 0.3, y: 0.65, w: 0.35 })
  const [fingerHandles, setFingerHandles] = useState({ left: 0.42, right: 0.58, y: 0.3 })
  const [autoDetected, setAutoDetected] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof diameterToResult> | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // O elemento <video> só existe no DOM quando stage === 'live' — se
  // tentássemos conectar o stream nele durante a espera de permissão
  // (stage === 'requesting'), o elemento ainda nem existiria ainda
  // (videoRef.current seria null), e o vídeo nunca receberia o stream
  // de verdade (bug real encontrado em teste: videoWidth ficava 0
  // pra sempre). Esse efeito conecta o stream assim que o elemento
  // realmente existe.
  useEffect(() => {
    if (stage === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [stage])

  async function startCamera() {
    setStage('requesting')
    setErrorMsg('')
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

  async function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Em alguns dispositivos o vídeo ainda não tem dimensões prontas
    // logo que a câmera abre — capturar nesse momento gera uma foto
    // vazia (0x0) e todo o cálculo depois vira NaN. Espera até o
    // vídeo ter frames de verdade antes de permitir capturar.
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMsg('A câmera ainda está inicializando — aguarde um instante e tente capturar de novo.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    streamRef.current?.getTracks().forEach((t) => t.stop())
    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.92))
    setPhotoSize({ w: canvas.width, h: canvas.height })

    setModelLoading(true)
    try {
      const landmarker = await getHandLandmarker()
      const detection = landmarker.detect(canvas)
      const hand = detection.landmarks?.[0]
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
    } catch {
      setAutoDetected(false)
    } finally {
      setModelLoading(false)
    }

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
          ao lado do dedo — os dois na mesma superfície, na mesma foto. Nossa IA localiza a base do dedo
          automaticamente; você só confirma o ajuste fino.
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
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} playsInline muted className="w-full" />
          <div
            className="pointer-events-none absolute rounded-md border-2 border-dashed border-gold/70"
            style={{
              left: '25%',
              bottom: '10%',
              width: '50%',
              aspectRatio: `${CARD_WIDTH_MM} / ${CARD_HEIGHT_MM}`,
            }}
          />
        </div>
        <p className="max-w-xs text-center text-[12px] text-ivory/50">
          Encaixe o cartão dentro da guia tracejada e mantenha a mão espalmada visível.
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
      {modelLoading && <p className="text-[13px] text-ivory/50">Localizando sua mão na foto…</p>}
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
