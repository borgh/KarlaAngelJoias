import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiGet } from '../lib/api'
import type { Glyph, ProductView, CategoryView, InstagramItemView } from '../lib/viewTypes'
import { products as defaultProducts, categories as defaultCategories } from '../data/products'
import { DEFAULT_CONTENT } from '../data/site'

type ApiCategory = { id: string; name: string; description: string; glyph: string; sortOrder: number }
type ApiProduct = {
  id: string
  name: string
  categoryId: string | null
  price: number
  badge: string
  imageUrl: string
  description: string
  isBestseller: boolean
  isActive: boolean
}
type ApiCarouselItem = { id: string; imageUrl: string; title: string; linkUrl: string; isActive: boolean }

type SiteData = {
  loading: boolean
  content: Record<string, string>
  products: ProductView[]
  categories: CategoryView[]
  instagramItems: InstagramItemView[]
}

const SiteDataContext = createContext<SiteData | null>(null)

const FALLBACK_CATEGORIES: CategoryView[] = defaultCategories.map((c, i) => ({
  id: `fallback-${i}`,
  name: c.name,
  description: c.description,
  glyph: c.glyph,
}))

const FALLBACK_PRODUCTS: ProductView[] = defaultProducts.map((p) => ({
  id: p.id,
  name: p.name,
  categoryName: p.category,
  price: p.price,
  badge: p.badge,
  glyph: p.glyph,
}))

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<Record<string, string>>(DEFAULT_CONTENT)
  const [products, setProducts] = useState<ProductView[]>(FALLBACK_PRODUCTS)
  const [categories, setCategories] = useState<CategoryView[]>(FALLBACK_CATEGORIES)
  const [instagramItems, setInstagramItems] = useState<InstagramItemView[]>([])

  useEffect(() => {
    async function load() {
      const [contentRes, categoriesRes, productsRes, igRes] = await Promise.all([
        apiGet<{ content: Record<string, string> }>('/api/site-content'),
        apiGet<{ categories: ApiCategory[] }>('/api/categories'),
        apiGet<{ products: ApiProduct[] }>('/api/products'),
        apiGet<{ items: ApiCarouselItem[] }>('/api/carousels/instagram'),
      ])

      if (contentRes?.content && Object.keys(contentRes.content).length > 0) {
        setContent({ ...DEFAULT_CONTENT, ...contentRes.content })
      }

      let categoryMap = new Map<string, CategoryView>()
      if (categoriesRes?.categories && categoriesRes.categories.length > 0) {
        const mapped = categoriesRes.categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          glyph: (c.glyph as Glyph) || 'ring',
        }))
        setCategories(mapped)
        categoryMap = new Map(mapped.map((c) => [c.id, c]))
      } else {
        categoryMap = new Map(FALLBACK_CATEGORIES.map((c) => [c.id, c]))
      }

      if (productsRes?.products) {
        const mapped: ProductView[] = productsRes.products
          .filter((p) => p.isActive)
          .map((p) => {
            const cat = p.categoryId ? categoryMap.get(p.categoryId) : undefined
            return {
              id: p.id,
              name: p.name,
              categoryName: cat?.name || '—',
              price: p.price,
              badge: p.badge || undefined,
              glyph: cat?.glyph || 'ring',
              imageUrl: p.imageUrl || undefined,
              description: p.description || undefined,
            }
          })
        if (mapped.length > 0) setProducts(mapped)
      }

      if (igRes?.items) {
        setInstagramItems(
          igRes.items
            .filter((i) => i.isActive)
            .map((i) => ({ id: i.id, imageUrl: i.imageUrl || undefined, title: i.title, linkUrl: i.linkUrl }))
        )
      }

      setLoading(false)
    }
    load()
  }, [])

  return (
    <SiteDataContext.Provider value={{ loading, content, products, categories, instagramItems }}>
      {children}
    </SiteDataContext.Provider>
  )
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSiteData precisa estar dentro de <SiteDataProvider>')
  return ctx
}
