// Textos e imagens padrão do site público — FONTE ÚNICA DE VERDADE do
// que o admin pode editar em "Textos do site". Mantido em espelho em
// src/data/site.ts (fallback do site se a API estiver fora do ar).
//
// O seed aplica esses valores SÓ para chaves que ainda não existem —
// nunca sobrescreve o que a cliente editou no admin (antes disso, o
// seed rodava a cada deploy e apagava todas as edições).
export const CONTENT_DEFAULTS = {
  // Barra de avisos (topo)
  'announcement.text': 'Até 6x sem juros · 5% off no Pix · Frete para todo o Brasil',

  // Hero — carrossel de fotos de fundo (até 4 slides; slide sem imagem não aparece)
  'hero.slide1_image': '/brand/hero-1.jpg',
  'hero.slide1_eyebrow': 'Ouro 18k · Prata 925 · Moissanite',
  'hero.slide1_title': 'Joias para\no seu brilho\nde todo dia.',
  'hero.slide1_cta_label': 'Ver mais vendidos',
  'hero.slide1_cta_href': '#mais-vendidos',
  'hero.slide2_image': '/brand/hero-2.jpg',
  'hero.slide2_eyebrow': 'Semijoias · banho de ouro 18k',
  'hero.slide2_title': 'Acabamento de\njoalheria, todo dia.',
  'hero.slide2_cta_label': 'Ver semijoias',
  'hero.slide2_cta_href': '#catalogo/semijoia',
  'hero.slide3_image': '/brand/hero-3.jpg',
  'hero.slide3_eyebrow': 'Easy chic',
  'hero.slide3_title': 'Camadas de ouro\npara compor o seu look.',
  'hero.slide3_cta_label': 'Ver joias',
  'hero.slide3_cta_href': '#catalogo/joias',
  'hero.slide4_image': '',
  'hero.slide4_eyebrow': '',
  'hero.slide4_title': '',
  'hero.slide4_cta_label': '',
  'hero.slide4_cta_href': '',
  'hero.whatsapp_label': 'Falar no WhatsApp',

  // Linhas da marca
  'lines.eyebrow': 'Nossas linhas',
  'lines.title': 'Escolha o seu brilho',
  'lines.badge': 'easy chic',
  'lines.semijoia_tagline': 'Banho de ouro 18k, para todo dia',
  'lines.joias_tagline': 'Ouro 18k e prata 925',
  'lines.moissanite_tagline': 'O brilho do diamante',
  'lines.noiva_tagline': 'Para o dia mais especial',
  'lines.cta': 'Ver peças',

  // Coleções (categorias)
  'collections.eyebrow': 'Coleções',
  'collections.title': 'Por tipo de peça',
  'collections.description': 'Peças desenhadas para se sobrepor sem competir — monte suas combinações.',

  // Benefícios
  'benefits.1_title': 'Frete para todo o Brasil',
  'benefits.1_desc': 'Envio cuidadoso, embalagem para presente',
  'benefits.2_title': 'Garantia de 1 ano',
  'benefits.2_desc': 'Peças antialérgicas, livres de níquel',
  'benefits.3_title': 'Até 6x sem juros',
  'benefits.3_desc': 'No cartão de crédito',
  'benefits.4_title': '5% off no Pix',
  'benefits.4_desc': 'Desconto à vista',

  // Mais vendidos
  'bestsellers.eyebrow': 'Mais vendidos',
  'bestsellers.title': 'As peças favoritas\nde quem já usa Karla Angel.',
  'bestsellers.link': 'Ver catálogo completo',
  'bestsellers.note': 'Catálogo ilustrativo — fotos reais das peças em breve.',

  // Catálogo
  'catalog.eyebrow': 'Catálogo completo',
  'catalog.title': 'Todas as peças, em um só lugar.',
  'catalog.all_lines': 'Todas as linhas',

  // Nossa história
  'about.eyebrow': 'Nossa história',
  'about.title': 'Joalheria pensada\npara o dia a dia real.',
  'about.tagline': 'easy chic',
  'about.image': '/brand/karla.jpg',
  'about.signature': 'Karla',
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

  // Instagram
  'instagram.title': 'Acompanhe no Instagram',

  // Newsletter
  'newsletter.eyebrow': 'Newsletter',
  'newsletter.title': 'Ganhe 10% off na primeira compra',
  'newsletter.subtitle': 'Assine e receba lançamentos, cupons exclusivos e inspirações de estilo direto no seu e-mail.',
  'newsletter.button': 'Assinar',
  'newsletter.success': 'Obrigada por assinar! Confira seu e-mail em breve. ✨',

  // Rodapé
  'footer.tagline': 'easy chic',
  'footer.description': 'Semijoias autorais com acabamento de joalheria, para o brilho do seu dia a dia.',
  'footer.legal': 'CNPJ: 00.000.000/0001-00 · em preenchimento',

  // Produto
  'product.default_description':
    'Peça em acabamento de joalheria — antialérgica e pensada para durar. Fale com a gente no WhatsApp para saber mais detalhes, disponibilidade e possibilidade de personalização.',
  'product.buy_label': 'Comprar no WhatsApp',

  // Contato
  'contact.whatsapp_base': 'https://wa.me/message/INYV4PHHJTYVM1',
  'contact.whatsapp_message': 'Olá! Vim pelo site e gostaria de saber mais sobre as peças da Karla Angel ✨',
  'contact.instagram_handle': '@karlaangeljoias',
  'contact.instagram_url': 'https://www.instagram.com/karlaangeljoias',
  'contact.email': 'contato@karlaangeljoias.com.br',
}
