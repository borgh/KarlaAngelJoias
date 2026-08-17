import { useEffect, useState } from 'react'

// Tipagem mínima do evento beforeinstallprompt (não faz parte do TS DOM padrão)
export type BeforeInstallPromptEvent = Event & {
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

function detectIos() {
  const ua = window.navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !(window.navigator as unknown as { MSStream?: unknown }).MSStream
}

/**
 * Estado único de "posso oferecer instalar o PWA agora?", compartilhado
 * por todo componente que precisa mostrar esse convite (botão no menu,
 * banner no topo no celular, etc.) — uma só fonte de verdade, pra não
 * ter dois componentes decidindo coisas diferentes sobre o mesmo evento
 * `beforeinstallprompt` (que só é disparado uma vez pelo navegador e
 * "consumido" ao ser usado).
 */
export function useInstallPwaState() {
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
    setIsIos(detectIos())

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  // "installable" = existe alguma forma de oferecer instalação agora
  // (Android/Chrome com prompt nativo pronto, OU iOS com instrução
  // manual) — usado pra decidir se mostra o banner/botão ou não.
  const installable = !installed && (!!deferredPrompt || isIos)

  return { installed, installable, canPromptNatively: !!deferredPrompt, isIos, promptInstall }
}
