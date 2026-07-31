# Karla Angel Joias — Site

Site institucional/catálogo da Karla Angel, semijoias de luxo (ouro 18k,
prata 925 e moissanite). React + Vite + TypeScript + Tailwind CSS v4 +
Framer Motion.

## Rodando localmente

O projeto tem 3 partes: site público (raiz), API (`server/`) e painel admin (`admin/`).

```bash
# 1. API (porta 4000)
cd server
npm install
cp .env.example .env   # defina JWT_SECRET
npm run seed            # cria o banco, categorias/produtos de exemplo e o 1º admin
npm start

# 2. Site público (porta 5173), em outro terminal
npm install
npm run dev

# 3. Painel admin (porta 5174), em outro terminal
cd admin
npm install
npm run dev
```

Em desenvolvimento, tanto o site quanto o admin fazem proxy de `/api`
para `http://localhost:4000` (configurado em `vite.config.ts` de cada
um) — não precisa rodar Nginx localmente.

## Conteúdo do site

Produtos, categorias, textos (hero/história/contato) e o carrossel do
Instagram são gerenciados pelo **painel admin** (`admin.karlaangeljoias.com.br`)
e ficam salvos no banco de dados da API — não precisa mais editar código
para trocar texto ou adicionar produto.

Os arquivos `src/data/products.ts` e `src/data/site.ts` continuam no
repositório apenas como **conteúdo de fallback**: se a API estiver fora
do ar, o site público continua funcionando com esses dados padrão em
vez de quebrar. Ilustrações de linha (`<JewelGlyph />`) aparecem como
placeholder para produtos que ainda não têm foto cadastrada no admin.

## Arquitetura

- `src/` — site público (React + Vite), lê produtos/textos/carrossel da API em tempo real, com fallback para dados padrão se a API estiver fora do ar
- `admin/` — painel administrativo (React + Vite), em `admin.karlaangeljoias.com.br`
- `server/` — API (Node + Express + armazenamento em arquivo JSON, sem dependências nativas compiladas), usada pelos dois acima via proxy interno do Nginx de cada domínio (mesma origem, sem CORS em produção)

## Painel administrativo

Acesse `https://admin.karlaangeljoias.com.br` para gerenciar:
- **Produtos**: criar, editar, excluir, subir foto, marcar como "mais vendido"
- **Categorias**
- **Textos do site**: hero, "Nossa história", dados de contato (WhatsApp/Instagram/e-mail)
- **Carrossel do Instagram**: imagens exibidas na seção "Acompanhe no Instagram"
- **Usuários do painel**: cada usuário tem 4 permissões independentes — criar, editar, excluir e gerenciar usuários. Só quem tem "gerenciar usuários" vê essa aba.

O primeiro usuário admin é criado automaticamente na instalação (ver `deploy/docker/setup.sh`), com e-mail `admin@karlaangeljoias.com.br` e uma senha aleatória gerada na hora — a senha só aparece uma vez, no fim da instalação, e também fica salva em `/var/www/karlaangeljoias/.secrets` no servidor.

## Deploy na Digital Ocean (159.65.167.133)

⚠️ **Importante — arquitetura real deste servidor**: ele já hospeda o
site **fusionbeef.com.br**, implantado via **Kamal** (ferramenta de
deploy da 37signals). Isso significa que **não há Nginx no host**
controlando as portas 80/443 — quem ocupa essas portas é o container
**`kamal-proxy`**, que roteia por domínio (Host header) para os
containers corretos. O `nginx` do sistema está instalado mas inativo
e não deve ser iniciado (entraria em conflito de porta com o Docker).

Por isso, cada parte do projeto (site público, API e painel admin) é
implantada como **containers Docker separados**, registrados no mesmo
`kamal-proxy`, cada um com seu próprio nome de serviço — totalmente
isolados do `fusion-beef-web` e do `fusion-beef-db`. Os arquivos em
`deploy/nginx/` (abordagem Nginx tradicional) **não se aplicam a este
servidor** — ficam no repo só como referência para outro ambiente sem Kamal.

### 1. DNS

Aponte os registros do domínio para o servidor (repita para o subdomínio do admin):

| Tipo | Nome  | Valor            |
|------|-------|-------------------|
| A    | @     | 159.65.167.133    |
| A    | www   | 159.65.167.133    |
| A    | admin | 159.65.167.133    |

### 2. Primeira instalação (uma vez só)

Via SSH no servidor:

```bash
curl -fsSL https://raw.githubusercontent.com/borgh/KarlaAngelJoias/main/deploy/docker/setup.sh | bash
```

Esse script:
1. Confirma que `kamal-proxy` e a rede Docker `kamal` existem (aborta se não existirem, sem alterar nada)
2. Clona o repositório em `/var/www/karlaangeljoias/repo`
3. Gera `JWT_SECRET` e a senha do primeiro admin automaticamente (salvos em `/var/www/karlaangeljoias/.secrets`, permissão 600)
4. Builda e sobe os 3 containers, nessa ordem: **API** → **site público** → **painel admin**
5. Registra `karlaangeljoias.com.br` (site) e `admin.karlaangeljoias.com.br` (painel) no `kamal-proxy`, cada um com certificado TLS próprio (Let's Encrypt automático)
6. Imprime no final o e-mail e a senha do primeiro usuário admin — **anote na hora**, não é mostrado de novo (mas fica salvo em `.secrets` no servidor)

O `kamal-proxy deploy` é *zero-downtime*: só troca o tráfego para o
container novo depois que ele responde saudável em `/up`.

### 3. Atualizações seguintes

```bash
cd /var/www/karlaangeljoias/repo
git pull
source /var/www/karlaangeljoias/.secrets   # recarrega JWT_SECRET e SEED_ADMIN_PASSWORD
bash deploy/docker/deploy-all.sh
```

Ou atualize só uma parte, se só ela mudou:
```bash
bash deploy/docker/api/deploy.sh      # só a API (precisa de JWT_SECRET no ambiente)
bash deploy/docker/deploy.sh          # só o site público
bash deploy/docker/admin/deploy.sh    # só o painel admin
```

Automatize via GitHub Actions com um step de SSH rodando os comandos
acima (`.github/workflows/deploy.yml` tem um exemplo baseado em rsync
que pode ser adaptado).

### Backup dos dados

Produtos, textos, usuários e imagens ficam em volumes Docker nomeados
(`karlaangeljoias-db` e `karlaangeljoias-uploads`), que **sobrevivem a
atualizações de container** — trocar a imagem não apaga nada. Para um
backup manual:

```bash
docker run --rm -v karlaangeljoias-db:/data -v $(pwd):/backup alpine \
  tar czf /backup/karlaangeljoias-db-$(date +%F).tar.gz -C /data .
docker run --rm -v karlaangeljoias-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/karlaangeljoias-uploads-$(date +%F).tar.gz -C /data .
```

### Checklist de segurança para não afetar o fusionbeef.com.br

- [x] Containers próprios (`karlaangeljoias-web-*`, `karlaangeljoias-api`, `karlaangeljoias-admin-*`), nunca reaproveitam ou reiniciam o `fusion-beef-web`
- [x] Service names próprios no kamal-proxy (`karlaangeljoias`, `karlaangeljoias-admin`), diferentes de `fusion-beef-web`
- [x] Hosts próprios — o kamal-proxy recusa (`Error: host is used by another service`) se algum dia tentar registrar um host que já pertence a outro serviço, então não há como sobrescrever o fusionbeef por acidente
- [x] Certificados TLS próprios, emitidos só para os novos hosts
- [x] `docker rm`/`image prune` dos scripts filtram por label (`app=karlaangeljoias`, `app=karlaangeljoias-admin`), nunca tocam em containers/imagens do fusionbeef
- [x] Volumes de dados (`karlaangeljoias-db`, `karlaangeljoias-uploads`) são nomeados e exclusivos, sem relação com o volume do `fusion-beef-db`
- [ ] Antes de rodar o setup, confirme com `docker exec kamal-proxy kamal-proxy list` que `fusion-beef-web` aparece, para ter uma referência do estado "antes"
