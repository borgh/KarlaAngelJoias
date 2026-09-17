// Resolve a URL de uma imagem pra PRÉVIA dentro do admin.
//
// Fotos enviadas pelo upload ficam em /uploads/… (servido pela API,
// que o Nginx do admin também encaminha) — funcionam direto. Já as
// fotos padrão da marca (/brand/hero-1.jpg, /brand/karla.jpg…) são
// arquivos estáticos do SITE PÚBLICO, não existem no domínio do admin:
// aqui a prévia precisa apontar pro site (bug real: apareciam quebradas
// nos campos "Foto de fundo" e "Foto" da Nossa história).
const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || 'https://karlaangeljoias.com.br'

export function resolveMediaUrl(url: string): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/uploads/')) return url
  return PUBLIC_SITE_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`)
}
