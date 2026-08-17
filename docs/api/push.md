# API — Push (Web Push)

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/push/subscribe` | logado | `{ endpoint, keys: { p256dh, auth } }` — salva a inscrição do navegador atual |
| POST | `/api/push/unsubscribe` | logado | `{ endpoint }` — remove a inscrição |
| POST | `/api/push/test` | logado | Envia uma notificação de teste pra **todas** as inscrições salvas |

Ver `docs/features/notificacoes-de-estoque.md` para o fluxo completo (VAPID, service worker, como o navegador se inscreve).

## Limpeza automática

Ao enviar (seja teste ou alerta real), se uma inscrição responder 404/410 (expirada/revogada pelo navegador), ela é removida automaticamente do banco — não acumula lixo indefinidamente. Ver `sendPushAlert` em `server/src/services/notify.js`.
