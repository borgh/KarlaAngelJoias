import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FIELDS: { key: string; label: string; multiline?: boolean; group: string }[] = [
  { key: 'hero.eyebrow', label: 'Texto pequeno acima do título', group: 'Hero (topo do site)' },
  { key: 'hero.title_line1', label: 'Título — linha 1', group: 'Hero (topo do site)' },
  { key: 'hero.title_line2', label: 'Título — linha 2 (destaque em dourado)', group: 'Hero (topo do site)' },
  { key: 'hero.title_line3', label: 'Título — linha 3', group: 'Hero (topo do site)' },
  { key: 'hero.subtitle', label: 'Parágrafo de apresentação', multiline: true, group: 'Hero (topo do site)' },

  { key: 'about.paragraph1', label: 'Parágrafo 1', multiline: true, group: 'Nossa história' },
  { key: 'about.paragraph2', label: 'Parágrafo 2', multiline: true, group: 'Nossa história' },
  { key: 'about.stat1_number', label: 'Estatística 1 — número', group: 'Nossa história' },
  { key: 'about.stat1_label', label: 'Estatística 1 — legenda', group: 'Nossa história' },
  { key: 'about.stat2_number', label: 'Estatística 2 — número', group: 'Nossa história' },
  { key: 'about.stat2_label', label: 'Estatística 2 — legenda', group: 'Nossa história' },
  { key: 'about.stat3_number', label: 'Estatística 3 — número', group: 'Nossa história' },
  { key: 'about.stat3_label', label: 'Estatística 3 — legenda', group: 'Nossa história' },

  { key: 'contact.whatsapp_base', label: 'Link do WhatsApp (wa.me/...)', group: 'Contato' },
  { key: 'contact.whatsapp_message', label: 'Mensagem padrão do WhatsApp', multiline: true, group: 'Contato' },
  { key: 'contact.instagram_handle', label: '@ do Instagram', group: 'Contato' },
  { key: 'contact.instagram_url', label: 'URL do Instagram', group: 'Contato' },
  { key: 'contact.email', label: 'E-mail de contato', group: 'Contato' },
]

export default function Content() {
  const { user } = useAuth()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get<{ content: Record<string, string> }>('/api/site-content').then((data) => {
      setValues(data.content)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      await api.put('/api/site-content/admin', { updates: values })
      setMessage('Alterações salvas com sucesso.')
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-ink/50">Carregando…</p>

  const groups = [...new Set(FIELDS.map((f) => f.group))]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Textos do site</h1>
          <p className="mt-1 text-sm text-ink/55">Edite os textos exibidos no site público.</p>
        </div>
        {user?.canEdit && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        )}
      </div>

      {message && <p className="mb-6 rounded-lg bg-ink/5 px-4 py-2.5 text-[13px] text-ink">{message}</p>}

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group} className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="mb-5 font-display text-lg text-ink">{group}</h2>
            <div className="space-y-4">
              {FIELDS.filter((f) => f.group === group).map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      disabled={!user?.canEdit}
                      rows={3}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold disabled:bg-ivory-dim"
                    />
                  ) : (
                    <input
                      disabled={!user?.canEdit}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold disabled:bg-ivory-dim"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
