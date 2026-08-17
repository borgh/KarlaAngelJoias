# API — Textos do site

Armazenamento chave/valor simples (`store.siteContent`) — cada texto editável do site público é uma chave string.

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/site-content` | — | Devolve `{ content: { "hero.eyebrow": "...", ... } }` — todas as chaves |
| PUT | `/api/site-content/admin` | `canEdit` | `{ updates: { chave: valor, ... } }` — atualiza várias chaves de uma vez |

## Chaves usadas hoje

| Chave | Onde aparece |
|---|---|
| `hero.eyebrow`, `hero.title_line1/2/3`, `hero.subtitle` | Seção Hero do site |
| `about.paragraph1/2`, `about.stat1_number/label`, `about.stat2_*`, `about.stat3_*` | Seção "Nossa história" |
| `contact.whatsapp_base`, `contact.whatsapp_message` | Base do link `wa.me/...` usado nos botões de compra |
| `contact.instagram_handle`, `contact.instagram_url` | Rodapé e seção Instagram |
| `contact.email` | Rodapé |

O site público (`src/context/SiteDataContext.tsx`) tem um conjunto de valores **padrão** (`DEFAULT_CONTENT` em `src/data/site.ts`) usados como fallback se a API estiver fora do ar ou uma chave ainda não existir — o site nunca quebra por falta de conteúdo.
