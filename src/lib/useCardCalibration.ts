import { useEffect, useState } from 'react'

// Tamanho real de um cartão de crédito/débito padrão (ISO/IEC 7810 ID-1).
export const CARD_WIDTH_MM = 85.6
export const CARD_HEIGHT_MM = 53.98

const STORAGE_KEY = 'karlaangel-ring-sizer-px-per-mm'

// Cada tela/dispositivo tem uma densidade de pixel diferente — por
// isso a calibração por objeto conhecido (cartão) é indispensável;
// sem ela não tem como converter "pixels na tela" em "milímetros
// reais". Guardamos o resultado no localStorage do navegador pra não
// pedir de novo toda vez que a pessoa voltar a usar a ferramenta.
export function useCardCalibration() {
  const [pxPerMm, setPxPerMmState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? Number(saved) : null
  })

  function setPxPerMm(value: number) {
    setPxPerMmState(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  function clearCalibration() {
    setPxPerMmState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { pxPerMm, setPxPerMm, clearCalibration }
}

// Hook simples pra saber se já existe calibração salva, sem precisar
// montar o componente inteiro do calibrador.
export function useHasSavedCalibration() {
  const [has, setHas] = useState(false)
  useEffect(() => {
    setHas(!!localStorage.getItem(STORAGE_KEY))
  }, [])
  return has
}
