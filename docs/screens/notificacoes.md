# Tela — Notificações de estoque (`/notificacoes`)

`admin/src/pages/NotificationSettings.tsx`. Ver `docs/features/notificacoes-de-estoque.md` pra lógica completa. Seções, de cima pra baixo:

1. **Padrão geral de estoque** — limite mínimo + canais de alerta usados quando produto/categoria não define os próprios.
2. **Push (neste dispositivo)** — botão liga/desliga + "enviar teste"; usa `admin/src/lib/push.ts`.
3. **E-mail (SMTP)** — formulário completo + "enviar e-mail de teste".
4. **WhatsApp** — se `whatsappServerConfigured: false` (variáveis de ambiente do servidor não configuradas), mostra aviso e não oferece conectar. Caso contrário: botão "Conectar WhatsApp" mostra QR code real, faz polling de status a cada 3s até conectar, então mostra "Conectado ✅" + botão desconectar. Campo separado (fora do bloco de conexão) pro número de **destino** dos alertas.

Um único botão "Salvar tudo" no topo manda as seções 1, 3 e o número de destino do WhatsApp de uma vez (`PUT /api/settings/notifications`) — a conexão do WhatsApp em si (QR code) é uma ação separada, não passa por esse botão.
