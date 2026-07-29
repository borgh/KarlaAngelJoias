// Ponto único de edição para links e dados de contato do site.
// Link de WhatsApp oficial extraído da bio do Instagram @karlaangeljoias.

const WHATSAPP_BASE = 'https://wa.me/message/INYV4PHHJTYVM1'
export const WHATSAPP_MESSAGE = 'Olá! Vim pelo site e gostaria de saber mais sobre as peças da Karla Angel ✨'
export const WHATSAPP_URL = `${WHATSAPP_BASE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

// Para CTAs de produto específico, gera o link com a mensagem já preenchida.
export function whatsappProductLink(message: string) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`
}

export const INSTAGRAM_HANDLE = '@karlaangeljoias'
export const INSTAGRAM_URL = 'https://www.instagram.com/karlaangeljoias'
export const FOLLOWERS_LABEL = '+4.300 seguidoras'
