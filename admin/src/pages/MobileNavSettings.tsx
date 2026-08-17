import { useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, AlertCircle, Plus, Smartphone, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { ALL_MOBILE_NAV_OPTIONS, DEFAULT_BOTTOM_NAV } from '../config/mobileNavOptions'

export default function MobileNavSettings() {
  const { user, refresh } = useAuth()
  const initial = user?.bottomNavConfig && user.bottomNavConfig.length > 0 ? user.bottomNavConfig : DEFAULT_BOTTOM_NAV
  const [selected, setSelected] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  // Só telas que o usuário realmente acessa (ex: sem permissão de
  // gerenciar usuários, não faz sentido oferecer fixar esse atalho).
  const availableOptions = ALL_MOBILE_NAV_OPTIONS.filter((o) => !o.requires || user?.[o.requires])
  const selectedOptions = selected
    .map((to) => availableOptions.find((o) => o.to === to))
    .filter((o): o is NonNullable<typeof o> => !!o)
  const toAdd = availableOptions.filter((o) => !selected.includes(o.to))

  function move(index: number, direction: -1 | 1) {
    const next = [...selected]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSelected(next)
  }

  function remove(to: string) {
    setSelected(selected.filter((t) => t !== to))
  }

  function add(to: string) {
    if (selected.length >= 4) return
    setSelected([...selected, to])
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await api.put('/api/auth/bottom-nav-config', { bottomNavConfig: selected })
      await refresh()
      setMessage({ text: 'Menu inferior salvo com sucesso.', isError: false })
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : 'Não foi possível salvar.', isError: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
          <Smartphone size={26} /> Menu inferior (celular)
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          Escolha até 4 atalhos que aparecem fixos na parte de baixo da tela quando você acessa o painel pelo
          celular — como um aplicativo de verdade. O botão <strong className="text-ink">Menu</strong> sempre aparece
          por último e abre o menu lateral completo. É uma preferência pessoal — só muda a sua barra, não a dos
          outros usuários.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6">
        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              message.isError ? 'border-garnet/20 bg-garnet/10 text-garnet' : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {message.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {message.text}
          </div>
        )}

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink/70">Botões selecionados ({selected.length}/4)</p>
          <div className="space-y-2">
            {selectedOptions.length === 0 && (
              <p className="text-sm italic text-ink/40">Nenhum atalho selecionado — a barra vai mostrar só o botão Menu.</p>
            )}
            {selectedOptions.map((opt, i) => (
              <div key={opt.to} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-ivory-dim px-3 py-2.5">
                <opt.icon size={18} className="shrink-0 text-gold" />
                <span className="flex-1 text-sm text-ink">{opt.label}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30">
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === selectedOptions.length - 1}
                  className="p-1 text-ink/40 hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
                <button onClick={() => remove(opt.to)} className="p-1 text-ink/40 hover:text-garnet">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {toAdd.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink/70">Adicionar</p>
            {selected.length >= 4 && (
              <p className="mb-2 text-[12px] text-ink/40">Máximo de 4 atingido — remova um pra adicionar outro.</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {toAdd.map((opt) => (
                <button
                  key={opt.to}
                  onClick={() => add(opt.to)}
                  disabled={selected.length >= 4}
                  className="flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-left text-[13px] text-ink/70 hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  <Plus size={14} className="shrink-0" />
                  <opt.icon size={16} className="shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
