import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ProductView } from '../lib/viewTypes'

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  stockQuantity: number
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (product: ProductView, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
  subtotal: number
  count: number
  isOpen: boolean
  open: () => void
  close: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'karlaangel-cart'

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: ProductView, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      // Nunca deixa o carrinho pedir mais do que existe em estoque —
      // o servidor confere de novo na hora de criar o pedido, isso
      // aqui é só pra dar um feedback imediato no carrinho.
      const maxQty = Math.max(0, product.stockQuantity)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: Math.min(maxQty, i.quantity + quantity) } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || '',
          stockQuantity: product.stockQuantity,
          quantity: Math.min(maxQty, quantity),
        },
      ]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(i.stockQuantity, quantity)) } : i))
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    subtotal,
    count,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de um CartProvider')
  return ctx
}
