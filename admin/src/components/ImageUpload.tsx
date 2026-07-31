import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

export function ImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await api.postForm<{ url: string }>('/api/upload', form)
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="relative w-40">
          <img src={value} alt="" className="aspect-square w-40 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-ivory shadow"
            aria-label="Remover imagem"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex aspect-square w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 text-ink/50 transition-colors hover:border-gold hover:text-gold"
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} strokeWidth={1.5} />}
          <span className="text-[12px]">{loading ? 'Enviando…' : 'Enviar imagem'}</span>
        </button>
      )}
      {error && <p className="mt-2 text-[12px] text-garnet">{error}</p>}
    </div>
  )
}
