// Valores padrão (fallback), usados enquanto a API carrega ou caso ela
// esteja fora do ar. Depois que a API responde, o conteúdo editado no
// painel administrativo (admin.karlaangeljoias.com.br) sobrescreve estes
// valores — ver src/context/SiteDataContext.tsx.

export const DEFAULT_CONTENT: Record<string, string> = {
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
}

export function buildWhatsappUrl(content: Record<string, string>, message?: string) {
  const base = content['contact.whatsapp_base'] || DEFAULT_CONTENT['contact.whatsapp_base']
  const text = message ?? content['contact.whatsapp_message'] ?? DEFAULT_CONTENT['contact.whatsapp_message']
  return `${base}?text=${encodeURIComponent(text)}`
}
