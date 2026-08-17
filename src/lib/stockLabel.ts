import type { ProductView } from './viewTypes'

export function getStockLabel(product: ProductView): { text: string; tone: 'out' | 'low' | 'ok' } {
  if (product.stockQuantity <= 0) {
    return { text: 'Esgotado', tone: 'out' }
  }
  if (product.isLowStock) {
    const unit = product.stockQuantity === 1 ? 'unidade' : 'unidades'
    return { text: `Últimas ${product.stockQuantity} ${unit}`, tone: 'low' }
  }
  return { text: 'Em estoque', tone: 'ok' }
}
