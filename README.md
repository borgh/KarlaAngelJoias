# Karla Angel Joias — Site

Site institucional/catálogo da Karla Angel, semijoias de luxo (ouro 18k,
prata 925 e moissanite). React + Vite + TypeScript + Tailwind CSS v4 +
Framer Motion.

## Rodando localmente

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera ./dist (arquivos estáticos)
npm run preview   # serve o build de produção localmente
```

## Conteúdo a revisar antes de publicar

- `src/data/products.ts` — catálogo é **placeholder**. Nomes de coleção
  (Aro Jade, Lizzie, rivieras, moissanite) foram tirados do Instagram
  @karlaangeljoias, mas preços e a lista completa de peças precisam ser
  confirmados e as fotos reais precisam substituir os ícones ilustrativos.
- `src/data/site.ts` — link de WhatsApp e @ do Instagram.
- Fotografia dos produtos: hoje o site usa ilustrações de linha (SVG)
  como placeholder. Assim que houver fotos em alta resolução das peças,
  troque os `<JewelGlyph />` por `<img>` nos componentes `Hero`,
  `BestSellers` e `InstagramStrip`.

## Deploy na Digital Ocean (159.65.167.133)

O servidor já hospeda outro site, **fusionbeef.com.br** — os passos
abaixo criam uma configuração totalmente isolada para
**karlaangeljoias.com.br**, sem alterar nada do site existente.

### 1. DNS

Aponte os registros do domínio `karlaangeljoias.com.br` (no seu
provedor de DNS) para o servidor:

| Tipo | Nome | Valor            |
|------|------|-------------------|
| A    | @    | 159.65.167.133    |
| A    | www  | 159.65.167.133    |

### 2. Preparar diretório no servidor (uma vez só)

Via SSH, como um usuário com sudo:

```bash
sudo mkdir -p /var/www/karlaangeljoias/dist
sudo chown -R $USER:$USER /var/www/karlaangeljoias
```

Este diretório é exclusivo do novo site — em nenhum momento o deploy
grava fora de `/var/www/karlaangeljoias/`.

### 3. Instalar a configuração do Nginx (uma vez só)

```bash
scp deploy/nginx/karlaangeljoias.com.br.conf SEU_USUARIO@159.65.167.133:/tmp/
ssh SEU_USUARIO@159.65.167.133
sudo mv /tmp/karlaangeljoias.com.br.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/karlaangeljoias.com.br.conf /etc/nginx/sites-enabled/
sudo nginx -t          # deve validar TODOS os sites, incluindo o fusionbeef, sem erro
sudo systemctl reload nginx
```

`nginx -t` testa a configuração inteira do servidor (todos os domínios).
Se o teste passar, nada foi quebrado — inclusive o fusionbeef continua
servindo normalmente, já que seu arquivo em `sites-available/` não é
tocado por esse processo.

### 4. Certificado SSL (uma vez só)

```bash
sudo certbot --nginx -d karlaangeljoias.com.br -d www.karlaangeljoias.com.br
```

O Certbot identifica pelo `server_name` qual arquivo editar — ele mexe
apenas em `karlaangeljoias.com.br.conf`, nunca no arquivo do fusionbeef.

### 5. Deploy do site (toda vez que atualizar)

Opção A — manual, da sua máquina:

```bash
DEPLOY_HOST=159.65.167.133 DEPLOY_USER=SEU_USUARIO ./deploy/deploy.sh
```

Opção B — automático via GitHub Actions: configure os secrets
`DEPLOY_HOST`, `DEPLOY_USER` e `DEPLOY_SSH_KEY` no repositório
(Settings → Secrets and variables → Actions) e todo push em `main`
publica automaticamente (`.github/workflows/deploy.yml`).

### Checklist de segurança para não afetar o fusionbeef.com.br

- [x] Root do site em diretório próprio: `/var/www/karlaangeljoias/`
- [x] Arquivo de config Nginx próprio: `karlaangeljoias.com.br.conf`
- [x] `server_name` específico — Nginx roteia por domínio, sem colisão
- [x] Certbot cria certificado próprio para o novo domínio
- [x] Deploy (`rsync --delete`) atua só dentro de `/var/www/karlaangeljoias/dist/`
- [ ] Antes de rodar qualquer comando `sudo`, confirme com `nginx -T | grep server_name`
      que os dois domínios aparecem listados corretamente

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (tokens de marca em `src/index.css`)
- Framer Motion (animações)
- lucide-react (ícones)
