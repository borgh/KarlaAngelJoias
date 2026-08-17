import { useState } from 'react'
import { circumferenceToResult, diameterToResult, MIN_CIRCUMFERENCE_MM, MAX_CIRCUMFERENCE_MM } from '../../lib/ringSizeChart'
import { RingSizeResultCard } from './RingSizeResultCard'

export function ManualTab() {
  const [mode, setMode] = useState<'circumference' | 'diameter'>('circumference')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [submittedValue, setSubmittedValue] = useState<{ num: number; mode: 'circumference' | 'diameter' } | null>(
    null
  )

  const result = submittedValue
    ? submittedValue.mode === 'circumference'
      ? circumferenceToResult(submittedValue.num)
      : diameterToResult(submittedValue.num)
    : null

  function handleSubmit() {
    const num = Number(value.replace(',', '.'))
    if (!value || !Number.isFinite(num) || num <= 0) {
      setError('Digite um número válido.')
      return
    }
    const circumference = mode === 'circumference' ? num : num * Math.PI
    if (circumference < MIN_CIRCUMFERENCE_MM || circumference > MAX_CIRCUMFERENCE_MM) {
      setError('Esse valor parece fora da faixa comum de anéis — confira se está em milímetros.')
      return
    }
    setError('')
    setSubmittedValue({ num, mode })
  }

  function handleReset() {
    setSubmittedValue(null)
    setValue('')
    setError('')
  }

  if (result) {
    return <RingSizeResultCard result={result} onReset={handleReset} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-sm text-center text-[14px] text-ivory/70">
        Já sabe a circunferência ou o diâmetro interno (em milímetros)? Meça com um fio enrolado no dedo + régua, ou
        com um paquímetro num anel que já sirva.
      </p>

      <div className="flex rounded-full border border-ivory/20 p-1">
        <button
          onClick={() => setMode('circumference')}
          className={`rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
            mode === 'circumference' ? 'bg-gold text-ink' : 'text-ivory/60'
          }`}
        >
          Circunferência
        </button>
        <button
          onClick={() => setMode('diameter')}
          className={`rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
            mode === 'diameter' ? 'bg-gold text-ink' : 'text-ivory/60'
          }`}
        >
          Diâmetro
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={mode === 'circumference' ? 'Ex: 54' : 'Ex: 17,2'}
          className="w-32 rounded-lg border border-ivory/20 bg-transparent px-4 py-2.5 text-center text-lg text-ivory outline-none focus:border-gold"
        />
        <span className="text-ivory/50">mm</span>
      </div>

      {error && <p className="text-[13px] text-garnet">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!value}
        className="rounded-full bg-gold px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-gold-bright disabled:opacity-40"
      >
        Ver tamanho
      </button>
    </div>
  )
}
