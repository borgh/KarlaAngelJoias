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

// Diferente de apiGet: erros aqui precisam chegar até quem chamou (o
// checkout precisa saber SE deu errado e POR QUÊ — "sem estoque",
// "endereço inválido" etc. — pra mostrar pro cliente, não só falhar
// em silêncio como o resto do site faz quando a API está fora do ar.
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) {
    throw new ApiError(data?.error || `Erro ${res.status}`, res.status)
  }
  return data as T
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) {
    throw new ApiError(data?.error || `Erro ${res.status}`, res.status)
  }
  return data as T
}
