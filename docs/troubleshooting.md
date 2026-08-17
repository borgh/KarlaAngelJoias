# Troubleshooting — problemas reais já resolvidos

Formato: **Problema** → **Causa** → **Solução**. Se o que você está vendo parece familiar, confira aqui antes de investigar do zero.

---

## `better-sqlite3` causava Segmentation Fault em produção

**Problema**: a API travava com `Segmentation fault (core dumped)` ao abrir o banco de dados (`new Database(...)`), consistentemente, só em produção.

**Causa**: nunca isolada com 100% de certeza — investigação extensa via `strace` mostrou o crash acontecendo dentro do próprio binário do Node (não do addon SQLite), num acesso de memória a endereço baixo (assinatura clássica de ponteiro nulo/corrompido, típica de incompatibilidade de ABI entre um binário nativo pré-compilado e a versão exata do Node/V8 rodando). Tentativas que **não resolveram**: trocar Alpine por Debian (musl vs. glibc), reiniciar o servidor (descartando teoria de condição de corrida por recurso), recompilar do zero com `--build-from-source` (o pacote nem chegou a compilar de verdade — `node-gyp` sozinho só fazia `touch` nos stamps sem gerar o binário final, porque pulava a etapa própria do pacote que prepara o código-fonte do SQLite).

**Solução definitiva**: removido `better-sqlite3` do projeto inteiro, substituído por um armazenamento em arquivo JSON puro em JavaScript (`server/src/db/store.js`) — zero dependências com código nativo compilado. Ver `docs/features/admin-panel-e-permissoes.md`.

---

## Nginx + Docker: 502 depois de um deploy

**Problema**: depois de trocar o container da API (deploy normal, zero-downtime), o site/admin começaram a responder `502 Bad Gateway`.

**Causa**: o Nginx resolve hostnames em `proxy_pass` **uma única vez**, na inicialização do worker — quando o container de destino é substituído (ganha IP novo na rede Docker), o Nginx continua com o IP antigo em cache, que não existe mais.

**Solução**: usar o resolver DNS interno do Docker (`resolver 127.0.0.11 valid=10s;`) combinado com uma **variável** no `proxy_pass` (`set $api_upstream nome:porta; proxy_pass http://$api_upstream;`) — isso força o Nginx a resolver de novo a cada requisição em vez de cachear pra sempre. Ver `deploy/docker/nginx.conf` e `admin/nginx.conf`.

---

## `proxy_pass` com variável duplicava o path (404)

**Problema**: depois de corrigir o 502 acima, as chamadas começaram a dar `404` — o backend recebia `/api/api/auth/login` em vez de `/api/auth/login`.

**Causa**: quando o `proxy_pass` usa variável, o Nginx **não faz** a substituição normal do prefixo da location — ele concatena o path original inteiro com o que estiver escrito depois da variável.

**Solução**: nunca colocar path nenhum depois da variável no `proxy_pass` — só `http://$api_upstream;` (sem `/api/` no final). O Nginx então repassa a URL original sem modificar, e como o path já tem o prefixo certo (`/api/...`), chega correto no backend. Testado com um Nginx real rodando localmente antes de publicar, comparando o path recebido pelo backend.

---

## Efeito de brilho ficava com uma faixa estática visível

**Problema**: o efeito de "brilho passando" nas fotos de produto ficava com uma faixa clara sempre visível em algum ponto da imagem, mesmo fora do momento em que deveria "flashear".

**Causa**: o gradiente CSS usado como brilho tinha `background-repeat` no valor padrão (`repeat`) — mesmo a animação deslocando a posição pra fora da área visível, uma cópia repetida do gradiente continuava aparecendo dentro do container.

**Solução**: `background-repeat: no-repeat` na classe `.shimmer-bg` (`src/index.css`). Ver `docs/features/efeitos-visuais-produto.md`.

---

## Chave de API com `$$` dava 401 mesmo "copiada certa"

**Problema**: ao integrar o WhatsApp com a Evolution API já usada pelo VBMA, `POST /instance/create` retornava `401 Unauthorized` mesmo copiando a chave exatamente do arquivo `.env` do outro sistema pro arquivo de segredos deste.

**Causa**: a chave real continha `$$` (`ValckenBorgh$$201627520017`) — símbolo especial do Bash (PID do processo atual). O jeito como cada sistema carrega a variável de ambiente na hora do deploy (`export $(grep ... | xargs)` sem aspas, vs. `source arquivo` com aspas) resulta em expansões diferentes desse `$$`, então "a mesma" chave, copiada como texto, virava dois valores efetivos diferentes nos dois sistemas. Confirmado comparando o tamanho em caracteres da variável dentro de cada container: 26 vs. 25.

**Solução**: em vez de copiar o **texto** do arquivo `.env` de outro sistema, pegar o valor **já processado** direto do container que já funciona: `docker exec vbma_evolution printenv AUTHENTICATION_API_KEY`, e salvar esse valor entre aspas simples no arquivo de segredos deste projeto (protege contra reinterpretação futura pelo shell). Ver `docs/features/notificacoes-de-estoque.md`.

---

## Menu inferior "sumindo e voltando" itens ao excluir vários

**Problema**: excluir itens do carrossel do Instagram em sequência rápida parecia "recriar" itens já excluídos, voltando pro número original.

**Causa**: nenhuma — o arquivo de dados no servidor sempre esteve correto (confirmado lendo o JSON direto). Era só a tela do navegador não tendo recarregado a lista mais recente antes do próximo clique, dando a impressão de itens "voltando".

**Solução**: nenhuma mudança de código necessária — um F5 resolvia. Documentado aqui porque a investigação inicial (containers duplicados, condição de corrida no backend) levou um tempo até se confirmar que os dados sempre estiveram certos.
