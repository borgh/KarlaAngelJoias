# Notificações de estoque (push, e-mail, WhatsApp)

## Onde fica o código

- `server/src/services/notify.js` — toda a lógica de disparo dos 3 canais.
- `server/src/routes/settings.js` — rotas de configuração e teste.
- `admin/src/pages/NotificationSettings.tsx` — tela `/notificacoes`.
- `admin/src/lib/push.ts` — inscrição de push no navegador (lado do cliente).
- `admin/src/sw.js` — service worker customizado, handlers de `push` e `notificationclick`.

## Os 3 canais, resumidamente

| Canal | Tecnologia | Onde configura | Segredo fica onde |
|---|---|---|---|
| **Push** | Web Push / VAPID (`web-push`) | Botão "Ativar push" na tela de Notificações (por dispositivo/usuário) | Chaves VAPID geradas automaticamente no 1º boot da API, salvas no `settings.push` (não são segredo de terceiro, só do próprio sistema) |
| **E-mail** | SMTP (`nodemailer`) | Formulário na tela de Notificações | Senha SMTP no banco (JSON), mascarada nas respostas da API |
| **WhatsApp** | Evolution API (não-oficial, QR code — mesma tecnologia do VBMA) | Botão "Conectar WhatsApp" (QR code) | URL/chave da Evolution API **só em variável de ambiente do servidor**, nunca no banco nem no git |

## Deduplicação (não fica repetindo o alerta)

`checkAndNotifyLowStock()` só dispara notificação de verdade na **primeira vez** que o estoque cruza o limite pra baixo — marca `lowStockNotifiedAt` no produto. Enquanto continuar baixo, chamadas seguintes (edições, outros ajustes) não notificam de novo. Assim que o estoque volta a subir acima do limite, `lowStockNotifiedAt` volta a `null`, permitindo notificar de novo numa próxima queda.

## WhatsApp — por que é diferente dos outros dois

Diferente de SMTP e push (configuráveis 100% pelo admin, sem depender de infraestrutura externa), o WhatsApp usa a **mesma Evolution API já rodando pro VBMA**, mas com uma **instância própria** (`EVOLUTION_INSTANCE_NAME=karlaangeljoias`, separada da instância `vbma`) — WhatsApps completamente independentes, mesma infraestrutura.

Isso exigiu:
1. O container `karlaangeljoias-api` ser conectado também na rede Docker `vbma_network` (além da `kamal` padrão) — só assim ele alcança o hostname interno `http://vbma_evolution:8080`. Ver `deploy/docker/api/deploy.sh`, variável `EVOLUTION_DOCKER_NETWORK`.
2. A URL/chave nunca aparecerem na tela — o admin só vê um botão "Conectar WhatsApp" que gera um QR code de verdade (endpoint `/instance/connect/{instância}` da Evolution API), igual conectar o WhatsApp Web.

### Fluxo de conexão (QR code)

1. Admin clica "Conectar WhatsApp" → `POST /api/settings/whatsapp/connect`.
2. Backend chama `createWhatsAppInstance()` (idempotente — se já existir, ignora 403/409) e depois `getWhatsAppQrCode()`.
3. Frontend mostra a imagem base64 recebida e começa a **consultar o status a cada 3 segundos** (`GET /api/settings/whatsapp/status`) até virar `"open"`.
4. Assim que conecta, o QR some e mostra "WhatsApp conectado ✅" com botão de desconectar.

### Problema real já enfrentado: chave com `$$`

A chave da Evolution API usada em produção continha `$$` (`ValckenBorgh$$201627520017`) — esse é um símbolo especial do shell Bash (significa "PID do processo atual"). Dependendo de como um script carrega o `.env` (`export $(grep ... | xargs)` sem aspas vs. `source arquivo.env` com aspas), o valor efetivo da variável pode sair **diferente** entre dois sistemas usando "a mesma" chave.

Isso causou `401 Unauthorized` mesmo com a chave aparentemente certa copiada pro arquivo de segredos. A correção definitiva foi pegar o valor **direto do container que já funciona** em vez de copiar o texto do arquivo:
```bash
docker exec vbma_evolution printenv AUTHENTICATION_API_KEY
```
Ver `troubleshooting.md` para o relato completo do diagnóstico.

## Segredos — nunca no repositório

`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME` são variáveis de ambiente passadas em `deploy/docker/api/deploy.sh`, lidas de `/var/www/karlaangeljoias/.secrets` no servidor (arquivo com permissão 600, fora do git). O mesmo padrão do `JWT_SECRET`. Ver `docs/development/environment-variables.md`.
