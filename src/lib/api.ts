const BASE = '' // mesmo domínio — o Nginx do site faz proxy de /api para a API

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // Site continua funcionando com os dados padrão (fallback) se a API
    // estiver fora do ar — nunca quebra a experiência do visitante.
    return null
  }
}
