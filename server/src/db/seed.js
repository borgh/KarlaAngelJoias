import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from './index.js'

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@karlaangeljoias.com.br'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'TrocarSenha123!'
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin Karla Angel'

function upsertContent(key, value) {
  db.prepare(
    `INSERT INTO site_content (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, value)
}

// --- Usuário admin inicial -------------------------------------------------
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL)
if (!existingAdmin) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, can_create, can_edit, can_delete, can_manage_users)
     VALUES (?, ?, ?, ?, 1, 1, 1, 1)`
  ).run(nanoid(), ADMIN_NAME, ADMIN_EMAIL, hash)
  console.log(`✅ Usuário admin criado: ${ADMIN_EMAIL} / senha: ${ADMIN_PASSWORD}`)
  console.log('   -> troque essa senha assim que fizer o primeiro login.')
} else {
  console.log(`ℹ️  Usuário admin ${ADMIN_EMAIL} já existe, não foi recriado.`)
}

// --- Categorias --------------------------------------------------------
const categories = [
  { id: 'aneis', name: 'Anéis', description: 'Do minimalista ao cravejado', glyph: 'ring', sort_order: 1 },
  { id: 'colares', name: 'Colares', description: 'Camadas para compor o seu look', glyph: 'necklace', sort_order: 2 },
  { id: 'brincos', name: 'Brincos', description: 'Argolas, ear cuffs e clássicos', glyph: 'earring', sort_order: 3 },
  { id: 'rivieras', name: 'Rivieras', description: 'Cravejadas, para empilhar', glyph: 'bracelet', sort_order: 4 },
  { id: 'moissanite', name: 'Moissanite', description: 'O brilho do diamante, em ouro 18k', glyph: 'ring', sort_order: 5 },
]
const insertCategory = db.prepare(
  `INSERT INTO categories (id, name, description, glyph, sort_order) VALUES (@id, @name, @description, @glyph, @sort_order)
   ON CONFLICT(id) DO NOTHING`
)
for (const c of categories) insertCategory.run(c)

// --- Produtos (placeholder, editável pelo admin) ------------------------
const products = [
  { name: 'Anel Lizzie Cravejado', category_id: 'aneis', price: 289.9, badge: 'Mais vendido', is_bestseller: 1 },
  { name: 'Colar Aro Jade', category_id: 'colares', price: 349.9, badge: 'Novo', is_bestseller: 1 },
  { name: 'Brinco Lizzie', category_id: 'brincos', price: 219.9, badge: '', is_bestseller: 1 },
  { name: 'Riviera Cravejada Dupla', category_id: 'rivieras', price: 429.9, badge: 'Mais vendido', is_bestseller: 1 },
  { name: 'Anel Solitário Moissanite', category_id: 'moissanite', price: 599.9, badge: 'Luxo', is_bestseller: 1 },
  { name: 'Colar Gota Esmeralda', category_id: 'colares', price: 379.9, badge: 'Novo', is_bestseller: 0 },
  { name: 'Ear Cuff Constelação', category_id: 'brincos', price: 259.9, badge: '', is_bestseller: 0 },
  { name: 'Riviera Moissanite Tênis', category_id: 'moissanite', price: 749.9, badge: 'Luxo', is_bestseller: 1 },
]
const productCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n
if (productCount === 0) {
  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, category_id, price, badge, description, image_url, is_bestseller, sort_order)
     VALUES (@id, @name, @category_id, @price, @badge, @description, @image_url, @is_bestseller, @sort_order)`
  )
  products.forEach((p, i) => {
    insertProduct.run({
      id: nanoid(),
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      badge: p.badge,
      description: '',
      image_url: '',
      is_bestseller: p.is_bestseller,
      sort_order: i,
    })
  })
  console.log(`✅ ${products.length} produtos de exemplo inseridos.`)
}

// --- Conteúdo do site (hero, história, rodapé) --------------------------
upsertContent('hero.eyebrow', 'Ouro 18k · Prata 925 · Moissanite')
upsertContent('hero.title_line1', 'Joias para')
upsertContent('hero.title_line2', 'o seu brilho')
upsertContent('hero.title_line3', 'de todo dia.')
upsertContent(
  'hero.subtitle',
  'Curadoria exclusiva de semijoias de luxo: ouro 18k, prata 925 e peças em moissanite, com o brilho e o acabamento de uma joalheria — para usar todos os dias ou guardar para ocasiões especiais.'
)
upsertContent(
  'about.paragraph1',
  'A Karla Angel nasceu de uma curadoria pessoal: peças em ouro 18k, prata 925 e moissanite escolhidas a dedo, com o mesmo padrão de acabamento de uma joalheria — para usar no dia a dia ou guardar para uma data especial.'
)
upsertContent(
  'about.paragraph2',
  'Do anel de entrada à riviera cravejada, cada lançamento passa por uma seleção criteriosa antes de chegar até você — com garantia, autenticidade e o cuidado de quem entende de joia.'
)
upsertContent('about.stat1_number', '+4.300')
upsertContent('about.stat1_label', 'seguidoras no Instagram')
upsertContent('about.stat2_number', '423')
upsertContent('about.stat2_label', 'peças e posts publicados')
upsertContent('about.stat3_number', '100%')
upsertContent('about.stat3_label', 'curadoria exclusiva')
upsertContent('contact.whatsapp_base', 'https://wa.me/message/INYV4PHHJTYVM1')
upsertContent('contact.whatsapp_message', 'Olá! Vim pelo site e gostaria de saber mais sobre as peças da Karla Angel ✨')
upsertContent('contact.instagram_handle', '@karlaangeljoias')
upsertContent('contact.instagram_url', 'https://www.instagram.com/karlaangeljoias')
upsertContent('contact.email', 'contato@karlaangeljoias.com.br')

// --- Itens de carrossel (Instagram) --------------------------------------
const igCount = db.prepare("SELECT COUNT(*) AS n FROM carousel_items WHERE carousel = 'instagram'").get().n
if (igCount === 0) {
  const insertItem = db.prepare(
    `INSERT INTO carousel_items (id, carousel, title, subtitle, image_url, link_url, sort_order)
     VALUES (?, 'instagram', '', '', '', '', ?)`
  )
  for (let i = 0; i < 6; i++) insertItem.run(nanoid(), i)
  console.log('✅ Itens de exemplo do carrossel do Instagram inseridos.')
}

console.log('Seed concluído.')
