import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Armazenamento em arquivo JSON, 100% JavaScript puro — sem nenhum
// código nativo compilado. Isso é intencional: um banco como o
// better-sqlite3 depende de um binário C++ compilado especificamente
// para a versão do Node/host, e isso se mostrou instável neste
// servidor de produção. Para a escala deste painel (catálogo de uma
// loja), um arquivo JSON é mais que suficiente, e elimina de vez essa
// classe de problema.
//
// Todas as escritas são síncronas e reescrevem o arquivo inteiro — o
// volume de dados aqui é pequeno (produtos, categorias, usuários,
// textos) e o painel admin não tem uso concorrente pesado, então isso
// é seguro e simples.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })
const DB_FILE = path.join(DATA_DIR, 'karlaangel.json')

const DEFAULT_DATA = {
  users: [],
  categories: [],
  products: [],
  siteContent: {},
  carouselItems: [],
  pushSubscriptions: [],
  settings: {
    // Estoque — padrões globais, usados quando o produto e a categoria
    // dele não têm um valor próprio definido.
    globalMinStockThreshold: 3,
    globalNotifyChannels: ['email'], // 'push' | 'email' | 'whatsapp'

    smtp: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromName: 'Karla Angel Joias',
      fromEmail: '',
      notifyToEmail: '',
    },
    // Número que RECEBE os alertas — não é segredo, fica editável aqui.
    // A URL/chave/instância da Evolution API em si vêm de variáveis de
    // ambiente do servidor (nunca salvas no banco nem no git), porque
    // são compartilhadas com o servidor Evolution já usado pelo VBMA.
    whatsappNotifyNumber: '',
    push: {
      vapidPublicKey: '',
      vapidPrivateKey: '',
    },
  },
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    save(DEFAULT_DATA)
    return structuredClone(DEFAULT_DATA)
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    const merged = { ...structuredClone(DEFAULT_DATA), ...parsed }
    // Merge de um nível a mais para settings/subgrupos, pra não perder
    // chaves novas (ex: adicionadas em atualização futura do sistema)
    // quando o arquivo salvo em disco ainda não as tem.
    merged.settings = {
      ...structuredClone(DEFAULT_DATA.settings),
      ...(parsed.settings || {}),
      smtp: { ...structuredClone(DEFAULT_DATA.settings.smtp), ...(parsed.settings?.smtp || {}) },
      push: { ...structuredClone(DEFAULT_DATA.settings.push), ...(parsed.settings?.push || {}) },
    }
    return merged
  } catch (err) {
    console.error('Falha ao ler o banco de dados, recriando do zero:', err)
    save(DEFAULT_DATA)
    return structuredClone(DEFAULT_DATA)
  }
}

function save(data) {
  // Escreve em arquivo temporário e renomeia — evita corromper o
  // arquivo principal caso o processo seja interrompido no meio da escrita.
  const tmpFile = `${DB_FILE}.tmp`
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmpFile, DB_FILE)
}

let data = load()

export function nowIso() {
  return new Date().toISOString()
}

// API genérica de coleção (lista de registros com "id").
function collection(name) {
  return {
    all() {
      return structuredClone(data[name])
    },
    find(predicate) {
      const item = data[name].find(predicate)
      return item ? structuredClone(item) : undefined
    },
    filter(predicate) {
      return structuredClone(data[name].filter(predicate))
    },
    insert(record) {
      data[name].push(record)
      save(data)
      return structuredClone(record)
    },
    update(id, patch) {
      const idx = data[name].findIndex((r) => r.id === id)
      if (idx === -1) return null
      data[name][idx] = { ...data[name][idx], ...patch }
      save(data)
      return structuredClone(data[name][idx])
    },
    remove(id) {
      const before = data[name].length
      data[name] = data[name].filter((r) => r.id !== id)
      const removed = data[name].length < before
      if (removed) save(data)
      return removed
    },
    removeWhere(predicate) {
      data[name] = data[name].filter((r) => !predicate(r))
      save(data)
    },
    updateWhere(predicate, patch) {
      data[name] = data[name].map((r) => (predicate(r) ? { ...r, ...patch } : r))
      save(data)
    },
  }
}

export const store = {
  users: collection('users'),
  categories: collection('categories'),
  products: collection('products'),
  carouselItems: collection('carouselItems'),
  pushSubscriptions: collection('pushSubscriptions'),
  siteContent: {
    all() {
      return structuredClone(data.siteContent)
    },
    setMany(updates) {
      data.siteContent = { ...data.siteContent, ...updates }
      save(data)
      return structuredClone(data.siteContent)
    },
  },
  settings: {
    get() {
      return structuredClone(data.settings)
    },
    update(patch) {
      data.settings = {
        ...data.settings,
        ...patch,
        smtp: { ...data.settings.smtp, ...(patch.smtp || {}) },
        push: { ...data.settings.push, ...(patch.push || {}) },
      }
      save(data)
      return structuredClone(data.settings)
    },
  },
}
