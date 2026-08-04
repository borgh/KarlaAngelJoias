import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

// Tipagem mínima do evento beforeinstallprompt (não faz parte do TS DOM padrão)
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS Safari nunca dispara beforeinstallprompt — mostramos instruções
    // manuais nesse caso em vez do botão de instalação automática.
    const ua = window.navigator.userAgent
    setIsIos(/iphone|ipad|ipod/i.test(ua) && !(window.navigator as unknown as { MSStream?: unknown }).MSStream)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-ink"
      >
        <Download size={14} strokeWidth={2} /> Instalar app
      </button>
    )
  }

  // iOS sem prompt automático: instrução manual (Compartilhar → Adicionar à Tela de Início)
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
