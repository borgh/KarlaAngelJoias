# Variáveis de ambiente

Todas lidas pelo container `karlaangeljoias-api` (`server/`). Site público e admin não têm variáveis de ambiente próprias (tudo que precisam vem da API via `fetch`, através do proxy do Nginx).

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `JWT_SECRET` | **Sim** | — | Assina o cookie de sessão. O servidor recusa iniciar sem ela. Gerada automaticamente por `deploy/docker/setup.sh` na primeira instalação (`openssl rand -hex 32`), reaproveitada nos deploys seguintes. |
| `NODE_ENV` | Não | `development` | `production` no deploy real — afeta o flag `secure` do cookie. |
| `PORT` | Não | `4000` | Porta interna da API. |
| `DATA_DIR` | Não | `./data` (dev) / `/data` (Docker) | Onde fica o arquivo `karlaangel.json`. |
| `UPLOAD_DIR` | Não | `./uploads` (dev) / `/app/uploads` (Docker) | Onde ficam as imagens enviadas. |
| `CORS_ORIGINS` | Não | `http://localhost:5173,http://localhost:5174` | Origens permitidas — só relevante em dev (produção usa proxy same-origin, CORS não entra em jogo). |
| `SEED_ADMIN_EMAIL` | Não | `admin@karlaangeljoias.com.br` | E-mail do primeiro usuário administrativo, criado pelo seed se ainda não existir. |
| `SEED_ADMIN_PASSWORD` | Não* | `TrocarSenha123!` | Senha do primeiro usuário. Em produção, `deploy/docker/setup.sh` gera uma senha aleatória automaticamente na 1ª instalação. |
| `SEED_ADMIN_NAME` | Não | `Admin Karla Angel` | Nome do primeiro usuário. |
| `EVOLUTION_API_URL` | Não** | (vazio) | URL da Evolution API (WhatsApp). Sem isso, a integração de WhatsApp fica indisponível sem quebrar o resto do sistema. Em produção: `http://vbma_evolution:8080` (hostname interno Docker). |
| `EVOLUTION_API_KEY` | Não** | (vazio) | Chave da Evolution API — **nunca commitar**, sempre vinda de `/var/www/karlaangeljoias/.secrets` no servidor. |
| `EVOLUTION_INSTANCE_NAME` | Não | `karlaangeljoias` | Nome da instância própria dentro do servidor Evolution compartilhado — mantém o WhatsApp desta loja separado de outros sistemas que usem o mesmo servidor. |
| `EVOLUTION_DOCKER_NETWORK` | Não | (vazio) | Nome da rede Docker onde o container da Evolution API está (ex: `vbma_network`) — o script de deploy conecta o container da API também nessa rede, além da `kamal` padrão. Sem isso, se a Evolution API só for alcançável por hostname interno, a conexão falha. |

\* Tecnicamente opcional pro processo subir, mas sem ela o primeiro admin fica com a senha padrão (`TrocarSenha123!`), que **deve** ser trocada imediatamente.
\** Tecnicamente opcional (o servidor sobe normal sem elas), mas a funcionalidade de WhatsApp fica indisponível — `whatsappServerConfigured: false` na resposta da API, e a tela de Notificações mostra um aviso em vez do botão de conectar.

## Onde ficam em produção

`/var/www/karlaangeljoias/.secrets` no servidor (permissão 600, fora do git). Formato simples `CHAVE=valor`, um por linha — carregado com `set -a && source .secrets && set +a` antes de rodar qualquer script de deploy. Ver `docs/architecture/overview.md`.

⚠️ Se um valor contiver caracteres especiais de shell (`$`, `` ` ``, aspas), **sempre envolva em aspas simples** no arquivo (`CHAVE='valor com $$ ou outra coisa'`) — sem isso, o `source` pode reinterpretar o valor de forma diferente do esperado. Ver o caso real documentado em `troubleshooting.md`.
