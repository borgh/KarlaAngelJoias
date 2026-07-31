import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { store, nowIso } from './store.js'

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@karlaangeljoias.com.br').toLowerCase()
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'TrocarSenha123!'
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin Karla Angel'

// --- Usuário admin inicial -------------------------------------------------
if (!store.users.find((u) => u.email === ADMIN_EMAIL)) {
  store.users.insert({
    id: nanoid(),
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    isActive: true,
    createdAt: nowIso(),
  })
  console.log(`✅ Usuário admin criado: ${ADMIN_EMAIL} / senha: ${ADMIN_PASSWORD}`)
  console.log('   -> troque essa senha assim que fizer o primeiro login.')
} else {
  console.log(`ℹ️  Usuário admin ${ADMIN_EMAIL} já existe, não foi recriado.`)
}

// --- Categorias --------------------------------------------------------
const categories = [
  { id: 'aneis', name: 'Anéis', description: 'Do minimalista ao cravejado', glyph: 'ring', sortOrder: 1 },
  { id: 'colares', name: 'Colares', description: 'Camadas para compor o seu look', glyph: 'necklace', sortOrder: 2 },
  { id: 'brincos', name: 'Brincos', description: 'Argolas, ear cuffs e clássicos', glyph: 'earring', sortOrder: 3 },
  { id: 'rivieras', name: 'Rivieras', description: 'Cravejadas, para empilhar', glyph: 'bracelet', sortOrder: 4 },
  { id: 'moissanite', name: 'Moissanite', description: 'O brilho do diamante, em ouro 18k', glyph: 'ring', sortOrder: 5 },
]
for (const c of categories) {
  if (!store.categories.find((existing) => existing.id === c.id)) {
    store.categories.insert(c)
  }
}

// --- Produtos (placeholder, editável pelo admin) ------------------------
const products = [
  { name: 'Anel Lizzie Cravejado', categoryId: 'aneis', price: 289.9, badge: 'Mais vendido', isBestseller: true },
  { name: 'Colar Aro Jade', categoryId: 'colares', price: 349.9, badge: 'Novo', isBestseller: true },
  { name: 'Brinco Lizzie', categoryId: 'brincos', price: 219.9, badge: '', isBestseller: true },
  { name: 'Riviera Cravejada Dupla', categoryId: 'rivieras', price: 429.9, badge: 'Mais vendido', isBestseller: true },
  { name: 'Anel Solitário Moissanite', categoryId: 'moissanite', price: 599.9, badge: 'Luxo', isBestseller: true },
  { name: 'Colar Gota Esmeralda', categoryId: 'colares', price: 379.9, badge: 'Novo', isBestseller: false },
  { name: 'Ear Cuff Constelação', categoryId: 'brincos', price: 259.9, badge: '', isBestseller: false },
  { name: 'Riviera Moissanite Tênis', categoryId: 'moissanite', price: 749.9, badge: 'Luxo', isBestseller: true },
]
if (store.products.all().length === 0) {
  const now = nowIso()
  products.forEach((p, i) => {
    store.products.insert({
      id: nanoid(),
      name: p.name,
      categoryId: p.categoryId,
      price: p.price,
      badge: p.badge,
      description: '',
      imageUrl: '',
      isBestseller: p.isBestseller,
      isActive: true,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    })
  })
  console.log(`✅ ${products.length} produtos de exemplo inseridos.`)
}

// --- Conteúdo do site (hero, história, rodapé) --------------------------
store.siteContent.setMany({
  'hero.eyebrow': 'Ouro 18k · Prata 925 · Moissanite',
  'hero.title_line1': 'Joias para',
  'hero.title_line2': 'o seu brilho',
  'hero.title_line3': 'de todo dia.',
  'hero.subtitle':
    'Curadoria exclusiva de semijoias de luxo: ouro 18k, prata 925 e peças em moissanite, com o brilho e o acabamento de uma joalheria — para usar todos os dias ou guardar para ocasiões especiais.',
  'about.paragraph1':
    'A Karla Angel nasceu de uma curadoria pessoal: peças em ouro 18k, prata 925 e moissanite escolhidas a dedo, com o mesmo padrão de acabamento de uma joalheria — para usar no dia a dia ou guardar para uma data especial.',
  'about.paragraph2':
    'Do anel de entrada à riviera cravejada, cada lançamento passa por uma seleção criteriosa antes de chegar até você — com garantia, autenticidade e o cuidado de quem entende de joia.',
  'about.stat1_number': '+4.300',
  'about.stat1_label': 'seguidoras no Instagram',
  'about.stat2_number': '423',
  'about.stat2_label': 'peças e posts publicados',
  'about.stat3_number': '100%',
  'about.stat3_label': 'curadoria exclusiva',
  'contact.whatsapp_base': 'https://wa.me/message/INYV4PHHJTYVM1',
  'contact.whatsapp_message': 'Olá! Vim pelo site e gostaria de saber mais sobre as peças da Karla Angel ✨',
  'contact.instagram_handle': '@karlaangeljoias',
  'contact.instagram_url': 'https://www.instagram.com/karlaangeljoias',
  'contact.email': 'contato@karlaangeljoias.com.br',
})

// --- Itens de carrossel (Instagram) --------------------------------------
if (store.carouselItems.filter((i) => i.carousel === 'instagram').length === 0) {
  for (let i = 0; i < 6; i++) {
    store.carouselItems.insert({
      id: nanoid(),
      carousel: 'instagram',
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      sortOrder: i,
      isActive: true,
    })
  }
  console.log('✅ Itens de exemplo do carrossel do Instagram inseridos.')
}

console.log('Seed concluído.')
