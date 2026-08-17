# Orientação rápida — leia antes de mexer no código

## O sistema, em uma frase

Site institucional de semijoias (`karlaangeljoias.com.br`) + painel administrativo completo (`admin.karlaangeljoias.com.br`, com estoque, notificações multi-canal e PWA instalável) + API própria, os três publicados no mesmo servidor Digital Ocean que já hospeda o **fusion-beef** e o **VBMA Sistemas** — sem nenhum dos três interferir nos outros.

## Stack

- **Site público** (`src/`): React 19 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
- **Painel admin** (`admin/`): React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Recharts + vite-plugin-pwa
- **API** (`server/`): Node + Express, **armazenamento em arquivo JSON puro** (`server/src/db/store.js`) — de propósito, sem nenhuma dependência nativa compilada (ver `troubleshooting.md` para o porquê)
- **Deploy**: containers Docker registrados no `kamal-proxy` já existente no servidor (não usa Nginx do host — ver `architecture/overview.md`)

## Antes de modificar algo

1. Leia este arquivo.
2. Leia o documento de `docs/features/` relevante ao que você vai mexer, se existir.
3. Se a mudança tocar em uma rota nova da API, confira `docs/api/README.md` pra manter o padrão de permissões (`requireAuth` + `requirePermission`).
4. Se for mexer em deploy/infraestrutura, leia `docs/architecture/overview.md` — **o servidor hospeda outros dois sistemas (fusionbeef, VBMA) que nunca podem ser afetados**.
5. Se o problema parecer familiar, confira `docs/troubleshooting.md` antes de investigar do zero.

## Depois de modificar algo

1. Rode `npm run build` nos projetos afetados (site/admin/server) antes de dar como concluído.
2. Teste localmente quando possível (seed + servidor + Playwright) antes de mandar pro servidor.
3. **Atualize os documentos afetados em `/docs` — não deixe pra depois.**
4. Adicione uma entrada no `CHANGELOG.md` (categoria Added/Changed/Fixed/Removed/Security).
5. Commit com mensagem explicando o porquê, não só o quê. Push.
6. No deploy real (servidor), sempre confirme com `docker exec kamal-proxy kamal-proxy list` que os outros serviços (fusion-beef-web, vbma-*) continuam `running` depois da mudança.

## Erros já resolvidos — não repetir

Ver `troubleshooting.md` para o relato completo de cada um. Resumo:

- **better-sqlite3 dava Segmentation Fault em produção** (confirmado via `strace`, persistente mesmo recompilando do zero, trocando Alpine por Debian, e reiniciando o servidor) — a causa nunca foi 100% isolada, mas o sintoma sempre envolvia o binário nativo. Solução definitiva: **nunca usar pacotes com código nativo compilado no backend** — o armazenamento é JSON puro em JavaScript (`better-sqlite3` foi removido do projeto).
- **Nginx + Docker cacheia DNS**: `proxy_pass http://nome-do-container:porta` resolve o IP só uma vez, na inicialização do worker do Nginx — se o container de destino for substituído (deploy), o Nginx antigo continua batendo no IP morto (502). Corrigido com `resolver 127.0.0.11 valid=10s` + variável no `proxy_pass` (ver `deploy/docker/nginx.conf` e `admin/nginx.conf`).
- **`proxy_pass` com variável não reescreve o path**: ao usar variável (necessário pro ponto acima), o Nginx passa a URL original inteira adiante em vez de substituir o prefixo da location — **não coloque path nenhum depois da variável** no `proxy_pass` (só `http://$var;`), senão duplica o prefixo (`/api/api/...`, 404).
- **`background-repeat` padrão do CSS**: um gradiente usado como "flash" de brilho animado ficava com uma cópia sempre visível em algum ponto da imagem, mesmo fora do momento do flash — porque `background-repeat` (padrão `repeat`) tila o gradiente. Sempre `background-repeat: no-repeat` em efeitos de brilho/sweep.
- **Cifra com `$$` em variável de ambiente**: uma chave de API contendo `$$` (que o shell interpreta como "PID do processo atual") é expandida de forma diferente dependendo de como o script de deploy carrega o `.env` (`export $(...)` sem aspas vs. `source` com aspas) — dois sistemas usando a "mesma" chave literal do arquivo podem acabar com valores efetivos diferentes. Quando isso é uma possibilidade, pegue o valor **direto da fonte** (`docker exec <container-que-já-funciona> printenv VAR`) em vez de copiar o texto do arquivo `.env`.

## Convenções de código

- Comentários em português, explicando o **porquê** de uma decisão não-óbvia.
- Todo texto visível na UI é em português (Brasil).
- Identidade visual fixa: paleta "ourivesaria contemporânea" (verde-joia `#0E2118`, ouro `#C89A4C`, marfim `#F6F2E8`, granada `#7C2F34`), tipografia Fraunces (display) + Manrope (corpo) — ver `src/index.css` e `admin/src/index.css`.
- Permissões da API sempre por 4 flags independentes no usuário: `canCreate`, `canEdit`, `canDelete`, `canManageUsers` — nunca um "role" fixo. Ver `docs/features/admin-panel-e-permissoes.md`.
- Segredos (chaves de API, senhas de SMTP, JWT_SECRET) **nunca vão para o git** — sempre variável de ambiente do container, seguindo o padrão já usado pelo `JWT_SECRET` (ver `development/environment-variables.md`).
