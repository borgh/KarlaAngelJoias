# Checkout com Mercado Pago

Cliente compra direto no site (carrinho → checkout embutido em 4 etapas → pagamento sem sair da página), e a Karla gerencia os pedidos no admin. O WhatsApp continua funcionando em paralelo — em cada produto e como reserva automática se o pagamento pelo site não estiver configurado ou for recusado.

## Por que Payment Brick, não Checkout Pro

O Mercado Pago oferece duas formas de integrar: **Checkout Pro** (redireciona pro domínio do Mercado Pago) e **Payment Brick** (formulário embutido na própria página, via SDK JS). Como o pedido foi explicitamente "sem sair do site", usamos o Payment Brick — o número do cartão nunca passa pelo nosso servidor (o SDK do MP tokeniza no navegador), o que mantém o site fora do escopo de PCI-DSS para dados de cartão.

## Arquitetura

### Backend
- **`server/src/db/store.js`** — coleção `orders` + `settings.mercadopago` (chaves sandbox/produção, modo ativo, segredo do webhook) + `settings.shipping` (frete fixo + grátis acima de X)
- **`server/src/services/mercadopago.js`** — único lugar que importa o SDK oficial (`mercadopago` no npm). `isPaymentConfigured()`, `getPublicPaymentInfo()` (chave pública, nunca a secreta), `createPayment()`, `getPayment()`, `verifyWebhookSignature()`
- **`server/src/routes/orders.js`**:
  - `POST /api/orders` (público) — **sempre recalcula preço e confere estoque do banco**, nunca confia no que vem do carrinho (testado: pedido tentando mandar `priceCents: 1` foi ignorado, servidor usou o preço real)
  - `POST /api/orders/:id/pay` (público) — recebe o token já gerado pelo Brick no navegador, cria a cobrança de verdade via SDK
  - `POST /api/orders/webhook/mercadopago` (público) — nunca confia no corpo do webhook, sempre busca o pagamento de novo na API do MP antes de atualizar o pedido; idempotente
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
