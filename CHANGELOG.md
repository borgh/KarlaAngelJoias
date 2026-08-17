# Changelog

Histórico de mudanças do Karla Angel Joias, gerado a partir do histórico real de commits do Git (retroativo, criado em 2026-08-17 junto com a estrutura de documentação em `/docs`). Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

Da fundação do projeto (29/07/2026) até hoje. Cada entrada tem o hash curto do commit entre colchetes.

## 2026-08-17

### Fixed
- Banner de instalar o PWA não aparecia na tela de login — só existia na área autenticada (dentro do `Layout`). Adicionado também em `Login.tsx`, posicionado no topo sem deslocar a centralização do formulário. `[efa00a6]`
- Convite pra instalar o PWA (`InstallPwaButton`) ficava escondido dentro do menu lateral/gaveta — no celular, ninguém via sem abrir o menu por conta própria. Adicionado `InstallPwaBanner`, visível direto no topo da tela principal só no celular. Lógica de detecção extraída pra um hook compartilhado (`usePwaInstall.ts`). Testado simulando o evento `beforeinstallprompt` em 3 cenários (Android, iOS, Desktop). `[cb24c6c]`
- Tela de Notificações (e outras 5 telas do admin) travava em "Carregando..." indefinidamente depois de um deploy — causa dupla: service worker do PWA servia JS antigo em cache pra navegação (corrigido com `NetworkFirst` só na navegação), e as funções de carregamento de dados não garantiam `setLoading(false)` em caso de erro (corrigido com `try/finally` em todas). `[b0d4857]`
- Documentação completa do sistema criada em `docs/`, mesmo padrão do VBMA — arquitetura, API, telas, funcionalidades, variáveis de ambiente e troubleshooting. `[538bea3]`
- WhatsApp via QR code — instância própria (`karlaangeljoias`) no mesmo servidor Evolution API já usado pelo VBMA, sem nunca expor URL/chave no código ou no banco (só variáveis de ambiente do container, mesmo padrão do `JWT_SECRET`). Tela de Notificações ganhou um card "Conectar WhatsApp" com QR code real, polling automático de status a cada 3s até conectar, e botão de desconectar. `[be3164a]`
- Gestão de estoque completa: `stockQuantity`, `minStockThreshold` e `notifyChannels` nos produtos, com hierarquia produto → categoria → padrão geral. Nova tela `/estoque` (busca, filtro de estoque baixo, ajuste rápido +/-, modal de configuração por produto). Aviso de estoque baixo no Dashboard. `[1820955]`
- Notificações multi-canal: e-mail (SMTP configurável, nodemailer), WhatsApp (Evolution API) e push (Web Push/VAPID), com deduplicação — só notifica quando o estoque cruza o limite mínimo pra baixo, não fica repetindo. Nova tela `/notificacoes` com formulários e botões de teste pra cada canal. Chaves VAPID geradas automaticamente no primeiro boot da API. `[1820955]`
- Menu inferior mobile configurável (mesmo padrão do VBMA): barra fixa no celular com até 4 atalhos + botão de Menu, preferência pessoal por usuário (`bottomNavConfig`), nova tela `/menu-inferior`. `[1820955]`
- Admin transformado em PWA de verdade: service worker customizado (`injectManifest`, permite handlers de `push`/`notificationclick`), manifest com ícones na identidade da marca, botão "Instalar app" (evento `beforeinstallprompt`, com instrução manual pro iOS). `[c3466b2]` (2026-08-04)
- Layout do admin reescrito pra responsivo mobile: sidebar fixa virou gaveta deslizante em telas pequenas, barra superior com hambúrguer, tabelas com scroll horizontal próprio. `[c3466b2]`

### Fixed
- Rota de upload checava a permissão com o nome antigo (`can_create`, resíduo da migração de snake_case pra camelCase) — fazia o upload de imagem retornar 403 mesmo pra admin com todas as permissões. `[b0b93c6]`

## 2026-08-01

### Added
- Mini estrelas cintilantes sobre as fotos dos produtos, em posições pseudo-aleatórias (mas estáveis por produto) — junto com o brilho diagonal, simulam reflexo de luz numa joia. `[4328c33]`
- Efeito de brilho estendido também pras fotos reais dos produtos (antes só aparecia no ícone placeholder). `[9fff619]`

### Changed
- Brilho ajustado pra ser um "flash" raro (pausa longa entre passadas) em vez de varredura contínua, com timing pseudo-aleatório por produto — nunca sincroniza entre cards, intercala naturalmente com as estrelas. `[61aa814]`
- Passada do brilho mais lenta e suave (a fase de movimento foi de ~12% pra ~30% do ciclo total). `[307d86c]`

### Fixed
- Faixa estática do brilho aparecendo mesmo fora do momento do flash — `background-repeat` padrão (`repeat`) fazia o gradiente tilar e uma cópia ficava sempre visível. Corrigido com `background-repeat: no-repeat`. `[866a460]`

## 2026-07-31

Dia mais intenso do projeto — implementação completa do painel administrativo, seguida de uma sequência de correções críticas de infraestrutura (a maior parte do dia foi diagnóstico em produção).

### Added
- Painel administrativo completo em `admin.karlaangeljoias.com.br`: login com sessão JWT, gestão de produtos (com upload de foto e descrição), categorias, textos do site, carrossel do Instagram, usuários administrativos com 4 permissões independentes (criar/editar/excluir/gerenciar usuários). Site público refatorado pra consumir tudo isso via API em tempo real, com fallback pros dados estáticos se a API cair. `[60b2fde]`
- Modal de detalhes do produto — clicar em qualquer card (não só o botão de comprar) abre imagem grande, categoria, preço, descrição e botão de WhatsApp. `[3f73ab1]`
- Seção "Catálogo Completo" (`#catalogo`), com filtro por categoria — mostra **todos** os produtos ativos, resolvendo o problema de produtos sem a marcação "mais vendido" não aparecerem em lugar nenhum. `[e13adf2]`
- Gráficos no dashboard do admin (Recharts): produtos por categoria, status ativo/oculto, mais vendidos vs. catálogo, e evolução do catálogo ao longo do tempo. `[d5c96e7]`

### Changed
- `better-sqlite3` substituído por armazenamento em arquivo JSON puro em JavaScript — depois de uma investigação extensa (ver `docs/troubleshooting.md`), essa foi a solução definitiva pro Segmentation Fault consistente em produção. Tentativas anteriores que não resolveram: trocar Alpine por Debian `[a40907e]`, forçar build a partir do código-fonte `[45248dd]`, compilar manualmente com node-gyp `[2b656e2]`, usar `npm rebuild --build-from-source` `[ff7e331]`. Solução final: `[3790198]`.

### Fixed
- Erro 413 (Payload Too Large) no upload de imagens — limite padrão do Nginx (1MB) bloqueava fotos de produto. Corrigido com `client_max_body_size 10M`. Favicon do admin adicionado no mesmo commit. `[683da83]`
- 502 Bad Gateway causado por cache de DNS do Nginx — resolver interno do Docker + variável no `proxy_pass`. `[88f525d]`
- 404 causado por duplicação de path (`/api/api/...`) depois da correção acima — path não deve ser incluído no `proxy_pass` quando se usa variável. `[0645ad1]`
- Seção "Mais Vendidos" mostrava todos os produtos, ignorando a marcação `isBestseller` — nunca havia filtro de verdade. `[16114a5]`
- Ícones do formulário de categoria traduzidos pra português (o valor salvo continua em inglês, usado pelo componente `JewelGlyph`). `[6b81aa8]`
- Limite de 6 itens no carrossel do Instagram removido do site público (o admin já permitia criar mais, mas a exibição estava travada em 6). `[df508b7]`

## 2026-07-29

### Added
- Site institucional Karla Angel Joias — React + Vite + Tailwind v4 + Framer Motion, identidade visual própria (verde-joia + ouro + marfim, Fraunces + Manrope), seções Hero/Coleções/Mais Vendidos/Nossa História/Instagram/Newsletter/Rodapé. `[85976bc]`
- Deploy via Docker registrado no `kamal-proxy` já existente no servidor — descoberto que o servidor usa Kamal (não Nginx tradicional no host) pra hospedar o fusion-beef, então a abordagem de deploy foi inteiramente redesenhada pra esse modelo, isolada do site já existente. `[e6d7f6e]`
- Script único de setup inicial do servidor. `[e760cb1]`

### Fixed
- Contraste do menu no topo da página — logo e links ficavam invisíveis (texto escuro sobre fundo escuro) antes de rolar a página, porque o menu é transparente no topo (sobre o hero). `[33d780f]`

### Changed
- Estatística "curadoria exclusiva" trocada pelo número real de posts do Instagram (423). `[d0f7405]`
