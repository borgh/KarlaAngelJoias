import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { ImageUpload } from '../components/ImageUpload'

type Field = { key: string; label: string; group: string; multiline?: boolean; image?: boolean; hint?: string }

// Um campo por texto/imagem editável do site. A ordem aqui é a ordem
// em que as seções aparecem no site (de cima pra baixo).
const HERO_SLIDE = (n: number, obrigatorio: boolean): Field[] => [
  {
    key: `hero.slide${n}_image`,
    label: 'Foto de fundo',
    group: `Início — slide ${n}`,
    image: true,
    hint: obrigatorio
      ? 'Foto de largura total (ideal: 2000×1366px, paisagem).'
      : 'Opcional — deixe sem foto para esse slide não aparecer.',
  },
  { key: `hero.slide${n}_eyebrow`, label: 'Texto pequeno acima do título', group: `Início — slide ${n}` },
  { key: `hero.slide${n}_title`, label: 'Título (use Enter para quebrar linha)', group: `Início — slide ${n}`, multiline: true },
  { key: `hero.slide${n}_cta_label`, label: 'Texto do botão', group: `Início — slide ${n}` },
  {
    key: `hero.slide${n}_cta_href`,
    label: 'Link do botão',
    group: `Início — slide ${n}`,
    hint: 'Ex.: #mais-vendidos, #catalogo, #catalogo/semijoia, #catalogo/joias, #catalogo/moissanite, #catalogo/noiva',
  },
]

const FIELDS: Field[] = [
  { key: 'announcement.text', label: 'Barra de avisos (topo do site)', group: 'Topo' },
  { key: 'hero.whatsapp_label', label: 'Texto do botão de WhatsApp no início', group: 'Topo' },

  ...HERO_SLIDE(1, true),
  ...HERO_SLIDE(2, false),
  ...HERO_SLIDE(3, false),
  ...HERO_SLIDE(4, false),

  { key: 'lines.eyebrow', label: 'Texto pequeno', group: 'Nossas linhas' },
  { key: 'lines.title', label: 'Título', group: 'Nossas linhas' },
  { key: 'lines.badge', label: 'Selo no canto dos cards (script)', group: 'Nossas linhas' },
  { key: 'lines.semijoia_tagline', label: 'Semijoia — frase', group: 'Nossas linhas' },
  { key: 'lines.joias_tagline', label: 'Joias — frase', group: 'Nossas linhas' },
  { key: 'lines.moissanite_tagline', label: 'Moissanite — frase', group: 'Nossas linhas' },
  { key: 'lines.noiva_tagline', label: 'Noiva — frase', group: 'Nossas linhas' },
  { key: 'lines.cta', label: 'Texto do link nos cards', group: 'Nossas linhas' },

  { key: 'collections.eyebrow', label: 'Texto pequeno', group: 'Coleções (por tipo de peça)' },
  { key: 'collections.title', label: 'Título', group: 'Coleções (por tipo de peça)' },
  { key: 'collections.description', label: 'Frase ao lado do título', group: 'Coleções (por tipo de peça)', multiline: true },

  ...[1, 2, 3, 4].flatMap((n) => [
    { key: `benefits.${n}_title`, label: `Benefício ${n} — título`, group: 'Benefícios' },
    { key: `benefits.${n}_desc`, label: `Benefício ${n} — descrição`, group: 'Benefícios' },
  ]),

  { key: 'bestsellers.eyebrow', label: 'Texto pequeno', group: 'Mais vendidos' },
  { key: 'bestsellers.title', label: 'Título (Enter quebra linha)', group: 'Mais vendidos', multiline: true },
  { key: 'bestsellers.link', label: 'Texto do link "ver catálogo"', group: 'Mais vendidos' },
  { key: 'bestsellers.note', label: 'Observação abaixo dos produtos (deixe vazio para ocultar)', group: 'Mais vendidos' },

  { key: 'catalog.eyebrow', label: 'Texto pequeno', group: 'Catálogo' },
  { key: 'catalog.title', label: 'Título', group: 'Catálogo' },
  { key: 'catalog.all_lines', label: 'Texto do filtro "todas as linhas"', group: 'Catálogo' },

  { key: 'about.image', label: 'Foto', group: 'Nossa história', image: true, hint: 'Retrato em pé (ideal: 1400×1750px, 4:5).' },
  { key: 'about.eyebrow', label: 'Texto pequeno', group: 'Nossa história' },
  { key: 'about.title', label: 'Título (Enter quebra linha)', group: 'Nossa história', multiline: true },
  { key: 'about.tagline', label: 'Frase em script abaixo do título', group: 'Nossa história' },
  { key: 'about.signature', label: 'Assinatura sobre a foto', group: 'Nossa história' },
  { key: 'about.paragraph1', label: 'Parágrafo 1', multiline: true, group: 'Nossa história' },
  { key: 'about.paragraph2', label: 'Parágrafo 2', multiline: true, group: 'Nossa história' },
  { key: 'about.stat1_number', label: 'Estatística 1 — número', group: 'Nossa história' },
  { key: 'about.stat1_label', label: 'Estatística 1 — legenda', group: 'Nossa história' },
  { key: 'about.stat2_number', label: 'Estatística 2 — número', group: 'Nossa história' },
  { key: 'about.stat2_label', label: 'Estatística 2 — legenda', group: 'Nossa história' },
  { key: 'about.stat3_number', label: 'Estatística 3 — número', group: 'Nossa história' },
  { key: 'about.stat3_label', label: 'Estatística 3 — legenda', group: 'Nossa história' },

  { key: 'instagram.title', label: 'Título', group: 'Instagram' },

  { key: 'newsletter.eyebrow', label: 'Texto pequeno', group: 'Newsletter' },
  { key: 'newsletter.title', label: 'Título', group: 'Newsletter' },
  { key: 'newsletter.subtitle', label: 'Frase', group: 'Newsletter', multiline: true },
  { key: 'newsletter.button', label: 'Texto do botão', group: 'Newsletter' },
  { key: 'newsletter.success', label: 'Mensagem após assinar', group: 'Newsletter' },

  { key: 'footer.tagline', label: 'Frase em script abaixo da logo', group: 'Rodapé' },
  { key: 'footer.description', label: 'Descrição curta', group: 'Rodapé', multiline: true },
  { key: 'footer.legal', label: 'Linha legal (CNPJ etc.)', group: 'Rodapé' },

  { key: 'product.buy_label', label: 'Texto do botão de compra', group: 'Produtos' },
  { key: 'product.default_description', label: 'Descrição padrão (quando o produto não tem descrição)', group: 'Produtos', multiline: true },

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
          <p className="mt-1 text-sm text-ink/55">Edite textos e fotos de todas as seções do site público, na ordem em que aparecem.</p>
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
                  {f.image ? (
                    <ImageUpload value={values[f.key] || ''} onChange={(url) => setValues({ ...values, [f.key]: url })} />
                  ) : f.multiline ? (
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
                  {f.hint && <p className="mt-1 text-[11px] text-ink/40">{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
