import { useRef, useState } from 'react'
import { Film, X, Loader2 } from 'lucide-react'
import { resolveMediaUrl } from '../lib/media'

export type ProductVideo = { url: string; poster: string }

const MAX_VIDEOS = 3
const MAX_MB = 150

// Envia um vídeo com barra de progresso (XHR, porque fetch não informa
// progresso de upload). Depois do envio o servidor ainda converte o
// vídeo (fase "Processando…").
function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<ProductVideo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload/video')
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data: { url?: string; poster?: string; error?: string } = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* resposta não-JSON (ex.: 413 do proxy) */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve({ url: data.url, poster: data.poster || '' })
      else if (xhr.status === 413) reject(new Error(`Vídeo muito grande (máximo ${MAX_MB} MB).`))
      else reject(new Error(data.error || `Erro ${xhr.status} ao enviar o vídeo.`))
    }
    xhr.onerror = () => reject(new Error('Falha de conexão ao enviar o vídeo.'))
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

export function VideoGalleryUpload({ videos, onChange }: { videos: ProductVideo[]; onChange: (v: ProductVideo[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Vídeo muito grande (máximo ${MAX_MB} MB).`)
      return
    }
    setProgress(0)
    try {
      const v = await uploadVideo(file, setProgress)
      onChange([...videos, v])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no envio do vídeo.')
    } finally {
      setProgress(null)
    }
  }

  const busy = progress !== null

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      <div className="flex flex-wrap gap-3">
        {videos.map((v, i) => (
          <div key={v.url} className="relative w-32">
            <video
              src={resolveMediaUrl(v.url)}
              poster={v.poster ? resolveMediaUrl(v.poster) : undefined}
              muted
              playsInline
              preload="metadata"
              controls
              className="aspect-square w-32 rounded-xl bg-ink object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(videos.filter((_, j) => j !== i))}
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-ivory shadow"
              aria-label="Remover vídeo"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {videos.length < MAX_VIDEOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 px-2 text-ink/50 transition-colors hover:border-gold hover:text-gold"
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Film size={20} strokeWidth={1.5} />}
            <span className="text-center text-[11px] leading-tight">
              {!busy
                ? `Adicionar vídeo (${videos.length}/${MAX_VIDEOS})`
                : progress! < 100
                  ? `Enviando… ${progress}%`
                  : 'Processando o vídeo… (pode levar 1-2 min)'}
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-[12px] text-ink/45">
        Até {MAX_VIDEOS} vídeos (até {MAX_MB} MB cada, qualquer formato do celular). Eles aparecem no site depois das fotos.
      </p>
      {error && <p className="mt-2 text-[12px] text-garnet">{error}</p>}
    </div>
  )
}
