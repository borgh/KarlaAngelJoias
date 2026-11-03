import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSiteData } from './SiteDataContext'
import { ProductModal } from '../components/ProductModal'
import { buildWhatsappUrl } from '../data/site'
import type { ProductView } from '../lib/viewTypes'

const PARAM = 'produto'

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Viewer = { open: (p: ProductView) => void }
const ProductViewerContext = createContext<Viewer>({ open: () => {} })
export const useProductViewer = () => useContext(ProductViewerContext)

export function productLink(id: string) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(PARAM, id)
  return url.toString()
}

function idFromUrl() {
  return new URLSearchParams(window.location.search).get(PARAM)
}

// Um único modal de produto para o site todo, sincronizado com a URL
// (?produto=<id>): o link copiado abre direto na tela do produto, e o
// botão "voltar" do navegador fecha o modal.
export function ProductViewerProvider({ children }: { children: ReactNode }) {
  const { products, content } = useSiteData()
  const [selectedId, setSelectedId] = useState<string | null>(() => idFromUrl())

  useEffect(() => {
    const onPop = () => setSelectedId(idFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = useCallback((p: ProductView) => {
    setSelectedId((prev) => {
      if (prev !== p.id) {
        const url = productLink(p.id)
        if (prev) window.history.replaceState(null, '', url)
        else window.history.pushState(null, '', url)
      }
      return p.id
    })
  }, [])

  const close = useCallback(() => {
    setSelectedId(null)
    if (idFromUrl()) window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  }, [])

  const selected = selectedId ? products.find((p) => p.id === selectedId) ?? null : null

  return (
    <ProductViewerContext.Provider value={{ open }}>
      {children}
      <ProductModal
        product={selected}
        whatsappUrl={
          selected
            ? buildWhatsappUrl(
                content,
                `Olá! Tenho interesse na peça "${selected.name}" (${formatBRL(selected.price)}) que vi no site. Ainda está disponível?`
              )
            : ''
        }
        onClose={close}
        onSelectProduct={open}
      />
    </ProductViewerContext.Provider>
  )
}
