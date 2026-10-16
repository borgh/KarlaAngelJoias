# Checkout com Mercado Pago

Cliente compra direto no site (carrinho → checkout embutido em 4 etapas → pagamento sem sair da página), e a Karla gerencia os pedidos no admin. O WhatsApp continua funcionando em paralelo — em cada produto e como reserva automática se o pagamento pelo site não estiver configurado ou for recusado.

## Por que Payment Brick, não Checkout Pro

O Mercado Pago oferece duas formas de integrar: **Checkout Pro** (redireciona pro domínio do Mercado Pago) e **Payment Brick** (formulário embutido na própria página, via SDK JS). Como o pedido foi explicitamente "sem sair do site", usamos o Payment Brick — o número do cartão nunca passa pelo nosso servidor (o SDK do MP tokeniza no navegador), o que mantém o site fora do escopo de PCI-DSS para dados de cartão.

## API de Orders (não a API de Payments)

Em 2026-10 a integração do servidor foi migrada da **API de Payments** (`POST /v1/payments`, que o Mercado Pago está descontinuando) para a **API de Orders** (`POST /v1/orders`, "Checkout Transparente via Orders"). O Payment Brick no navegador continua igual — ele só tokeniza o cartão; quem muda é a chamada que o servidor faz com esse token. O que é diferente na Orders:

- Cada cobrança é uma *order* (`id` "ORD…") com uma lista `transactions.payments[]` (cada uma com `id` "PAY…"). Guardamos os dois: `order.mpPaymentId` = id da order, `order.mpTransactionId` = id da transação.
- Valores são **strings** (`"215.00"`), e `total_amount` tem que ser igual à soma das transações.
- O **tipo** do meio de pagamento é obrigatório (`credit_card` / `debit_card` / `bank_transfer` para Pix). O Brick manda isso no segundo argumento do `onSubmit` (`additionalData.paymentTypeId`) e em `selectedPaymentMethod` — o `PaymentStep` repassa os dois pro servidor.
- Status com outros nomes: `processed` = aprovado, `failed` = recusado, `canceled` (um L só), `action_required` = aguardando (Pix esperando pagamento). `summarizeOrder()` em `services/mercadopago.js` traduz tudo pro vocabulário interno (`approved` / `pending` / `rejected` / `cancelled` / `refunded`), então o resto do sistema não precisa saber desses nomes.
- `X-Idempotency-Key` é obrigatório. Usamos `${pedido.id}-${tentativa}` — uma chave nova por tentativa, porque reusar a mesma chave com corpo diferente (outro cartão, ou Pix depois de um cartão recusado) dá 409 no MP.
- `notification_url` por requisição não existe mais: o webhook é configurado só no painel do MP (Suas integrações → Webhooks), evento **Order (Mercado Pago)**, separadamente em "Modo de teste" e "Modo de produção". O tópico que chega é `type=order` (o antigo `payment` é ignorado).
- Assinatura do webhook: `x-signature: ts=…,v1=…`, manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, HMAC-SHA256 hex com a "assinatura secreta" do painel. Usamos o `WebhookSignatureValidator` do próprio SDK (`mercadopago@3.6.1`). A doc do MP manda usar o `data.id` em minúsculas quando for alfanumérico e o validador do SDK usa como veio — aceitamos as duas variantes.

**Pix**: a resposta da order traz `qr_code` (copia e cola), `qr_code_base64` e `ticket_url` em `transactions.payments[0].payment_method`. O servidor devolve isso em `pix` na resposta do `/pay` e em `GET /api/orders/:id` (só enquanto `pending_payment`); a `ConfirmationStep` mostra o QR + botão copiar e consulta o pedido a cada 5 s até o webhook marcar como pago. Expira em 1 dia (`expiration_time: "P1D"`).

Testado com o MP mockado (cartão aprovado, recusado + nova tentativa com Pix, webhook assinado/inválido/tópico antigo, idempotência do débito de estoque, 409 em pedido já pago) — ver histórico do commit da migração.

## Arquitetura

### Backend
- **`server/src/db/store.js`** — coleção `orders` + `settings.mercadopago` (chaves sandbox/produção, modo ativo, segredo do webhook) + `settings.shipping` (frete fixo + grátis acima de X)
- **`server/src/services/mercadopago.js`** — único lugar que importa o SDK oficial (`mercadopago` no npm). `isPaymentConfigured()`, `getPublicPaymentInfo()` (chave pública, nunca a secreta), `createOrder()`, `getOrder()`, `summarizeOrder()` (tradução de status da API de Orders), `verifyWebhookSignature()`
- **`server/src/routes/orders.js`**:
  - `POST /api/orders` (público) — **sempre recalcula preço e confere estoque do banco**, nunca confia no que vem do carrinho (testado: pedido tentando mandar `priceCents: 1` foi ignorado, servidor usou o preço real)
  - `POST /api/orders/:id/pay` (público) — recebe o token já gerado pelo Brick no navegador, cria a cobrança de verdade via SDK
  - `POST /api/orders/webhook/mercadopago` (público) — nunca confia no corpo do webhook, sempre busca a order de novo na API do MP antes de atualizar o pedido; idempotente. É por isso que a assinatura secreta vazar não permite forjar pagamento.
  - `POST /api/orders/admin/:id/sync` (autenticado) — reconsulta o status no MP na hora (botão "Consultar status no Mercado Pago" no detalhe do pedido), pra quando o webhook não chegou
  - `GET /api/orders/config/payment-info` (público) — chave pública + `configured` + regra de frete, pro checkout do site
  - `GET /api/orders/:id` (público) — confirmação pro próprio cliente
  - `GET|PATCH /api/orders/admin/*` (autenticado) — listagem, detalhe, mudança de status/rastreio
- **`server/src/routes/settings.js`** — `PUT /api/settings/payments` (mascara o token de acesso na resposta, só devolve `...Set: true/false`)

### Site público
- **`src/context/CartContext.tsx`** — carrinho em `localStorage`, nunca deixa pedir mais que o estoque
- **`src/components/CartDrawer.tsx`** — painel lateral
- **`src/components/Checkout/`** — `CheckoutModal.tsx` (orquestra 4 etapas) → `InfoStep.tsx` (dados + endereço, CEP via ViaCEP) → `ReviewStep.tsx` (cria o pedido) → `PaymentStep.tsx` (Payment Brick ou aviso "indisponível" com fallback pro WhatsApp) → `ConfirmationStep.tsx`
- `ProductCard`/`ProductModal` — "Adicionar à sacola" como ação principal, WhatsApp como secundária (sempre disponível, útil enquanto as chaves não estão configuradas)

### Admin
- **Pedidos** (`admin/src/pages/Orders.tsx`) — lista com filtro/busca, detalhe com itens/cliente/endereço/pagamento, mudança de status e código de rastreio
- **Pagamentos** (`admin/src/pages/PaymentSettings.tsx`) — chaves sandbox/produção (**deixadas em branco de propósito** — a cliente ainda vai liberar acesso ao Mercado Pago Developers), regra de frete
- Dashboard — cards de vendas confirmadas/pedidos/aguardando pagamento, lista de pedidos recentes

## Estado atual — chaves em branco

`settings.mercadopago.sandboxAccessToken` e `productionAccessToken` começam vazios. Enquanto isso:
- `isPaymentConfigured()` retorna `false`
- O checkout do site pula direto pra uma mensagem clara — "Pagamento pelo site indisponível no momento" — com o pedido já registrado e um botão que abre o WhatsApp com o número e valor do pedido preenchidos
- **Nada quebra**: o pedido é criado normalmente (pending_payment), só não tem como cobrar até a Karla colar as chaves em Pagamentos → salvar

Quando as chaves chegarem: colar em Configurações → Pagamentos, testar em **sandbox** primeiro (cartões de teste do MP), só trocar pra **produção** depois de uma compra de teste completa (pedido → pagamento aprovado → estoque debitado → pedido aparece no admin).

## Bug real encontrado e corrigido durante o desenvolvimento

`InfoStep` (dados do cliente + endereço) originalmente levantava as duas peças de estado (`customer`, `address`) pro componente pai via um único callback `onChange(customerCompleto, addressCompleto)`, montado a partir de `{...customer, ...patch}` lido por *closure*. Preenchendo os campos em sequência rápida (digitação normal, ou autofill do navegador), um campo podia sobrescrever a mudança de outro que ainda não tinha propagado de volta como prop — **confirmado em teste**: o e-mail ficava vazio mesmo depois de preenchido, porque o campo de telefone (preenchido logo depois) usava uma cópia desatualizada do objeto `customer` sem o e-mail.

Corrigido trocando pra dois callbacks (`onCustomerChange`/`onAddressChange`) que recebem só o *patch*, mesclado no pai via `setState` funcional (`prev => ({...prev, ...patch})`) — isso elimina a corrida de vez, porque nunca depende de uma cópia antiga do estado capturada por closure.

## Limitações conhecidas (decisões conscientes, não bugs)

- **Frete simples**: valor fixo + grátis acima de X, sem integração com transportadora (Correios/etc.). Documentado como próximo passo natural se a Karla quiser cálculo por CEP/peso.
- **Estoque debitado só na aprovação do pagamento**, não na criação do pedido — evita debitar estoque de pedidos que nunca são pagos, mas em tese permite um pequeno overselling se muitos pedidos do mesmo item ficarem pendentes ao mesmo tempo. Aceitável na escala de uma loja como essa; reserva de estoque com expiração seria o próximo passo se virar um problema real.
- **CEP via ViaCEP** (`https://viacep.com.br/ws/{cep}/json/`, pública, sem chave) — se a busca falhar, o formulário permite preencher o endereço manualmente, nunca trava o checkout.
