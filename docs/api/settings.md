# API — Configurações e notificações

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/settings/notifications` | logado | Configurações atuais (senhas/chaves mascaradas, ver abaixo) |
| PUT | `/api/settings/notifications` | `canEdit` | Atualiza — campos de senha/chave vazios mantêm o valor atual |
| POST | `/api/settings/notifications/test-email` | `canEdit` | Envia e-mail de teste com o SMTP configurado |
| POST | `/api/settings/notifications/test-whatsapp` | `canEdit` | Envia WhatsApp de teste (exige instância conectada) |
| GET | `/api/settings/notifications/vapid-public-key` | logado | Chave pública VAPID (usada pelo navegador pra assinar push) |
| GET | `/api/settings/whatsapp/status` | `canEdit` | Estado da conexão: `unconfigured` \| `close` \| `connecting` \| `open` |
| POST | `/api/settings/whatsapp/connect` | `canEdit` | Cria a instância (se não existir) e devolve o QR code em base64 |
| POST | `/api/settings/whatsapp/disconnect` | `canEdit` | Desconecta (logout) a instância |

## Mascaramento de segredos

`GET /api/settings/notifications` **nunca** devolve a senha do SMTP em texto puro — só `passSet: true/false`. O mesmo vale pro campo de senha no formulário do admin: em branco = "não mudei", preenchido = "trocar por este valor". Ver `server/src/routes/settings.js`, função `serializeSettings`.

A chave da Evolution API (WhatsApp) **nem chega a passar pelo banco de dados** — vem direto de variável de ambiente do servidor (`EVOLUTION_API_KEY`), nunca é exposta por nenhuma rota. A API só devolve `whatsappServerConfigured: boolean` (se essas variáveis existem no container ou não). Ver `docs/features/notificacoes-de-estoque.md`.

## Estrutura de `settings` (armazenada)

```js
{
  globalMinStockThreshold: 3,
  globalNotifyChannels: ['email'],       // canais padrão quando produto/categoria não define os próprios
  smtp: { host, port, secure, user, pass, fromName, fromEmail, notifyToEmail },
  whatsappNotifyNumber: '',              // só o número de DESTINO dos alertas — não é segredo
  push: { vapidPublicKey, vapidPrivateKey },  // gerado automaticamente no primeiro boot da API
}
```
