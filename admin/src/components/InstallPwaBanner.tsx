import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { useInstallPwaState } from '../lib/usePwaInstall'

const DISMISS_KEY = 'karlaangel-admin-install-banner-dismissed'

// Diferente do InstallPwaButton (dentro do menu, só visível depois de
// abrir a gaveta), esse banner aparece direto na tela principal — só
// no celular (lg:hidden) — porque é onde instalar como app realmente
// faz diferença. Fechar esconde só pela sessão atual (sessionStorage),
// não permanentemente: reabrir o painel numa visita nova volta a
// oferecer, enquanto o app continuar não instalado no aparelho.
export function InstallPwaBanner() {
  const { installable, canPromptNatively, isIos, promptInstall } = useInstallPwaState()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')

  if (!installable || dismissed) return null

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-gold/30 bg-ink px-4 py-3 text-ivory lg:hidden">
      <Download size={18} className="shrink-0 text-gold" strokeWidth={1.8} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">Instale o painel neste celular</p>
        {canPromptNatively ? (
          <p className="text-[11px] text-ivory/60">Acesso mais rápido, direto da tela inicial.</p>
        ) : isIos ? (
          <p className="text-[11px] text-ivory/60">
            Toque em <span className="font-semibold text-ivory/80">Compartilhar</span> →{' '}
            <span className="font-semibold text-ivory/80">Adicionar à Tela de Início</span>.
          </p>
        ) : null}
      </div>
      {canPromptNatively && (
        <button
          onClick={promptInstall}
          className="shrink-0 rounded-full bg-gold px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright"
        >
          Instalar
        </button>
      )}
      <button onClick={dismiss} aria-label="Fechar" className="shrink-0 text-ivory/40 hover:text-ivory">
        <X size={16} />
      </button>
    </div>
  )
}
