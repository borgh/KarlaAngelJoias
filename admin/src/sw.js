/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

// Precache gerado automaticamente pelo build (vite-plugin-pwa injeta a
// lista de arquivos aqui em build time). O Workbox só intercepta essas
// rotas pré-cacheadas — chamadas de /api/ e /uploads/ nunca são
// interceptadas (não estão no manifesto), então sempre vão direto pra
// rede, com dados sempre atuais.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// IMPORTANTE: a navegação (abrir/recarregar a página) usa "rede
// primeiro, cache como reserva" em vez do cache-primeiro padrão do
// precache. Sem isso, depois de um deploy novo, quem já tinha o
// painel aberto (ou instalado como PWA) continuava recebendo o HTML/JS
// ANTIGO do cache — que podia não bater mais com o formato de dados da
// API já atualizada, travando telas em "Carregando..." pra sempre até
// um F5 forçado (Ctrl+Shift+R). Com rede primeiro, a versão mais nova
// é buscada sempre que houver conexão; só cai pro cache se estiver
// offline de verdade.
const navigationHandler = new NetworkFirst({
  cacheName: 'karlaangel-admin-pages',
  networkTimeoutSeconds: 3,
})
registerRoute(new NavigationRoute(navigationHandler))

// --- Notificações push (alertas de estoque baixo) -----------------------
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Karla Angel Joias', body: event.data.text() }
  }

  const title = payload.title || 'Karla Angel Joias'
  const options = {
    body: payload.body || '',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    data: { url: payload.url || '/' },
    tag: 'karlaangel-stock-alert',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Ao clicar na notificação: foca uma aba já aberta do painel se existir,
// senão abre uma nova na URL indicada (ex: /estoque).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
