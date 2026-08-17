import { Download } from 'lucide-react'
import { useInstallPwaState } from '../lib/usePwaInstall'

// Versão compacta — usada dentro do menu lateral/gaveta. Ver
// InstallPwaBanner.tsx para a versão em destaque mostrada direto na
// tela principal no celular (esse aqui sozinho fica escondido atrás
// do botão de menu, então não é suficiente como único convite).
export function InstallPwaButton() {
  const { installable, canPromptNatively, isIos, promptInstall } = useInstallPwaState()

  if (!installable) return null

  if (canPromptNatively) {
    return (
      <button
        onClick={promptInstall}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-ink"
      >
        <Download size={14} strokeWidth={2} /> Instalar app
      </button>
    )
  }

  if (isIos) {
    return (
      <p className="text-center text-[11px] leading-relaxed text-ivory/40">
        Para instalar: toque em{' '}
        <span className="font-semibold text-ivory/60">Compartilhar</span> e depois em{' '}
        <span className="font-semibold text-ivory/60">Adicionar à Tela de Início</span>.
      </p>
    )
  }

  return null
}
