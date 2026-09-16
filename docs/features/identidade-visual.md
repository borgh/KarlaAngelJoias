# Identidade visual 2025 (site público)

Fonte de verdade: brand book **"Identidade Visual 2025 — Karla Angel, por Laís Nass Design"** (PDF entregue pela cliente). O site segue esse padrão desde o redesign de 16/09/2026, com layout inspirado no [hstern.com.br](https://www.hstern.com.br/): fundo claro, logo centralizada no topo, barra de avisos, menu horizontal, hero com fotos de largura total em carrossel, cards brancos e muito respiro.

## Paleta (tokens em `src/index.css`)

| Token | Hex | Origem |
|---|---|---|
| `rose` | `#d6b7b5` | Pantone 5225 CVC — cor principal (barra de avisos, selos, newsletter, hover) |
| `rose-deep` | `#b98d8a` | rosé fechado — rótulos e links sobre fundo claro (contraste) |
| `taupe` | `#d4c6bd` | Pantone Warm Gray 2 U — bordas, superfícies |
| `taupe-deep` | `#a6968b` | rótulos secundários |
| `ivory` | `#f5f0ed` | off-white quente — fundo da página (é o fundo das aplicações da logo; o "#EAEAEA" impresso no PDF é um erro de rotulagem, o RGB 240/228/206 e as logos confirmam o tom quente) |
| `ivory-dim` | `#ede5df` | alternância de seções |
| `gold` / `gold-bright` / `gold-deep` | `#b8935e` / `#e6cc9d` / `#8a6a3e` | pontos do gradiente dourado do brand book (glyphs, preços, `.bg-gradient-gold`) |
| `ink` | `#4a403c` | charcoal quente — texto (a marca não usa preto puro) |

Os nomes `ink`/`ivory`/`gold`/`garnet` foram mantidos por compatibilidade com os componentes já existentes (guia de medidas, modal etc.); só os valores mudaram.

## Logomarca

`public/brand/logo-{dark,rose,taupe,white}.png` — wordmark "KARLA ANGEL" recortado dos arquivos oficiais (`Logo_Principal_*.png`) com fundo transparente e recolorido a partir da máscara da versão de maior contraste. Header/rodapé usam `logo-dark`; `logo-white` é para aplicações sobre foto. Símbolo alternativo "A com asa" existe no brand book mas não é usado no site.

## Tipografia — atenção a licença

O brand book usa **Mansory** (títulos/logo), **Boowie** (texto) e **Watermint Script** (assinatura). As três são **fontes comerciais / uso pessoal** — não podem ser embutidas num site comercial sem licença webfont. Decisão: a logo entra como **imagem** (Mansory "gravada" no arquivo oficial, uso legítimo), e o texto do site usa equivalentes gratuitas do Google Fonts:

- `--font-display`: **Josefin Sans** (light) — geométrica e elegante, próxima do desenho do wordmark
- `--font-body`: **Montserrat**
- `--font-script`: **Parisienne** — só para acentos ("easy chic", assinatura "Karla")

Se a cliente comprar a licença webfont da Mansory, basta adicionar o `@font-face` e trocar `--font-display` — duas linhas.

## Favicon e ícones de app

Símbolo alternativo "A com asa" (`Icone_*.png` do brand book) recortado com transparência em `public/brand/icon-{white,rose,dark,taupe}.png` (site e admin). Favicons/ícones PWA gerados por script: quadrado rosé arredondado com o símbolo branco — `favicon-32/64/192/512.png`, `apple-touch-icon.png` e versão *maskable* (símbolo menor, sem cantos arredondados, pra zona segura do Android). No admin viraram `pwa-192/512.png` + `pwa-maskable-512.png` do manifest (`background_color #f5f0ed`, `theme_color #d6b7b5`). Os `favicon.svg`/`icons.svg` antigos (verde) foram removidos.

## Painel admin

Mesmos tokens de cor e fontes do site (`admin/src/index.css`). Sidebar e login em charcoal quente com a logo branca, item ativo em rosé; gráficos do dashboard nas cores da paleta.

## Fotos

`public/brand/hero-{1,2,3}.jpg` (carrossel do hero) e `karla.jpg` (seção "Nossa história") foram extraídas do PDF com PyMuPDF e otimizadas (JPEG progressivo, 2000px). O 1º slide usa os textos editáveis no admin (Textos do site → Hero); os outros dois apresentam as linhas Semijoia e Joias.

## Responsividade

Testado com Playwright em 390×844 (mobile), 820×1180 (tablet) e 1440×900 (desktop): sem overflow horizontal, gaveta lateral no mobile/tablet com as 4 linhas em destaque, barra de avisos encurtada abaixo de `sm`, botão do card vira "Comprar" abaixo de `sm`.
