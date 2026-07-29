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

⚠️ **Importante — arquitetura real deste servidor**: ele já hospeda o
site **fusionbeef.com.br**, implantado via **Kamal** (ferramenta de
deploy da 37signals). Isso significa que **não há Nginx no host**
controlando as portas 80/443 — quem ocupa essas portas é o container
**`kamal-proxy`**, que roteia por domínio (Host header) para os
containers corretos. O `nginx` do sistema está instalado mas inativo
e não deve ser iniciado (entraria em conflito de porta com o Docker).

Por isso, o site da Karla Angel é implantado como **mais um container
Docker**, registrado no mesmo `kamal-proxy`, com service name e host
próprios — totalmente isolado do `fusion-beef-web` e do `fusion-beef-db`.
Os arquivos em `deploy/nginx/` (abordagem Nginx tradicional) **não se
aplicam a este servidor** — ficam no repo só como referência caso o
site seja implantado em outro ambiente sem Kamal.

### 1. DNS

Aponte os registros do domínio `karlaangeljoias.com.br` para o servidor:

| Tipo | Nome | Valor            |
|------|------|-------------------|
| A    | @    | 159.65.167.133    |
| A    | www  | 159.65.167.133    |

### 2. Primeira instalação (uma vez só)

Via SSH no servidor:

```bash
curl -fsSL https://raw.githubusercontent.com/borgh/KarlaAngelJoias/main/deploy/docker/setup.sh | bash
```

Esse script:
1. Confirma que `kamal-proxy` e a rede Docker `kamal` existem (aborta se não existirem, sem alterar nada)
2. Clona o repositório em `/var/www/karlaangeljoias/repo`
3. Builda a imagem Docker do site (`deploy/docker/Dockerfile`, multi-stage: Node builda o Vite, Nginx alpine serve os arquivos)
4. Sobe o container na rede `kamal` (a mesma do `fusion-beef-web`, só para o proxy conseguir rotear — os containers não se comunicam entre si)
5. Registra a rota no `kamal-proxy` com `--host karlaangeljoias.com.br --host www.karlaangeljoias.com.br --tls` (certificado Let's Encrypt automático, emitido só para este host)

O comando `kamal-proxy deploy` é *zero-downtime*: o proxy só troca o
tráfego para o container novo depois que ele responde saudável em `/up`.

### 3. Atualizações seguintes

```bash
cd /var/www/karlaangeljoias/repo
git pull
bash deploy/docker/deploy.sh
```

Ou automatize via GitHub Actions com um step de SSH que rode esse mesmo
comando (`.github/workflows/deploy.yml` tem um exemplo baseado em rsync
que pode ser adaptado para rodar `ssh ... 'cd ... && git pull && bash deploy/docker/deploy.sh'`).

### Checklist de segurança para não afetar o fusionbeef.com.br

- [x] Container próprio (`karlaangeljoias-web-*`), nunca reaproveita ou reinicia o `fusion-beef-web`
- [x] Service name próprio no kamal-proxy (`karlaangeljoias`), diferente de `fusion-beef-web`
- [x] Host próprio (`karlaangeljoias.com.br`) — o kamal-proxy recusa (`Error: host is used by another service`) se algum dia tentar registrar um host que já pertence a outro serviço, então não há como sobrescrever o fusionbeef por acidente
- [x] Certificado TLS próprio, emitido só para o novo host
- [x] `docker rm`/`image prune` do script filtram por `--label app=karlaangeljoias`, nunca tocam em containers/imagens do fusionbeef
- [ ] Antes de rodar o setup, confirme com `docker exec kamal-proxy kamal-proxy list` que `fusion-beef-web` aparece, para ter uma referência do estado "antes"
