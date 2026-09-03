import { useRef, useState } from 'react'
import { Upload, X, Loader2, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { api } from '../lib/api'

const MAX_IMAGES = 5

// Galeria de até 5 imagens por produto — upload, remover e reordenar
// (a primeira da lista é a "capa", usada no card do site e na
// miniatura da lista do admin). Reutiliza a mesma rota de upload que
// o antigo ImageUpload de imagem única.
export function ImageGalleryUpload({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList) {
    setError('')
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining)
    setLoading(true)
    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        const form = new FormData()
        form.append('file', file)
        const data = await api.postForm<{ url: string }>('/api/upload', form)
        uploaded.push(data.url)
      }
      onChange([...images, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload.')
    } finally {
      setLoading(false)
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url + i} className="relative w-32">
            <img src={url} alt="" className="aspect-square w-32 rounded-xl object-cover" />

            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink">
                <Star size={10} fill="currentColor" /> Capa
              </span>
            )}

            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-ivory shadow"
              aria-label="Remover imagem"
            >
              <X size={14} />
            </button>

            <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-full bg-ink/70 p-1 text-ivory disabled:opacity-30"
                aria-label="Mover pra esquerda"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                className="rounded-full bg-ink/70 p-1 text-ivory disabled:opacity-30"
                aria-label="Mover pra direita"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex aspect-square w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 text-ink/50 transition-colors hover:border-gold hover:text-gold"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} strokeWidth={1.5} />}
            <span className="text-center text-[11px] leading-tight">
              {loading ? 'Enviando…' : `Adicionar foto (${images.length}/${MAX_IMAGES})`}
            </span>
          </button>
        )}
      </div>

      <p className="mt-2 text-[12px] text-ink/45">
        Até {MAX_IMAGES} fotos. A primeira é a capa (aparece no card do site) — use as setinhas pra reordenar.
      </p>
      {error && <p className="mt-2 text-[12px] text-garnet">{error}</p>}
    </div>
  )
}
