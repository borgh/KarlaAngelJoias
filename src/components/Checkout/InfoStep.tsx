import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { CustomerInfo, AddressInfo } from './types'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function formatCep(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => [a && `(${a}) `, b, c && `-${c}`].filter(Boolean).join(''))
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => [a && `(${a}) `, b, c && `-${c}`].filter(Boolean).join(''))
}

function formatDocument(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].filter(Boolean).join(''))
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-taupe/70 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-rose'

export function InfoStep({
  customer,
  address,
  onCustomerChange,
  onAddressChange,
  onContinue,
}: {
  customer: CustomerInfo
  address: AddressInfo
  onCustomerChange: (patch: Partial<CustomerInfo>) => void
  onAddressChange: (patch: Partial<AddressInfo>) => void
  onContinue: () => void
}) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [touched, setTouched] = useState(false)

  // Cada chamada manda só o PATCH — a mesclagem com o restante do
  // objeto acontece no componente pai via setState funcional
  // (prev => ({...prev, ...patch})), nunca lendo `customer`/`address`
  // por closure aqui. Isso importa de verdade: passar o objeto
  // inteiro já mesclado aqui (como era antes) tem uma corrida real —
  // se dois campos mudam em sequência rápida (autofill do navegador,
  // ou até digitação/colar normal) antes do React re-renderizar entre
  // um e outro, o segundo campo sobrescreve o pai com uma cópia
  // desatualizada do primeiro, e esse valor se perde. Bug real
  // encontrado testando (o campo de e-mail ficava vazio mesmo
  // preenchido, quando o telefone era preenchido logo em seguida).
  function setCustomer(patch: Partial<CustomerInfo>) {
    onCustomerChange(patch)
  }
  function setAddress(patch: Partial<AddressInfo>) {
    onAddressChange(patch)
  }

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado — confira e preencha o endereço manualmente.')
        return
      }
      setAddress({
        street: data.logradouro || address.street,
        neighborhood: data.bairro || address.neighborhood,
        city: data.localidade || address.city,
        state: data.uf || address.state,
      })
    } catch {
      setCepError('Não deu pra buscar o CEP agora — preencha o endereço manualmente.')
    } finally {
      setCepLoading(false)
    }
  }

  const isValid =
    customer.name.trim().length > 2 &&
    /\S+@\S+\.\S+/.test(customer.email) &&
    customer.phone.replace(/\D/g, '').length >= 10 &&
    address.cep.replace(/\D/g, '').length === 8 &&
    address.street.trim() &&
    address.number.trim() &&
    address.city.trim() &&
    address.state.trim().length === 2

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-deep">Seus dados</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome completo" className="sm:col-span-2">
            <input
              value={customer.name}
              onChange={(e) => setCustomer({ name: e.target.value })}
              className={inputClass}
              placeholder="Seu nome"
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ email: e.target.value })}
              className={inputClass}
              placeholder="seu@email.com"
            />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ phone: formatPhone(e.target.value) })}
              className={inputClass}
              placeholder="(27) 99999-9999"
            />
          </Field>
          <Field label="CPF (opcional, agiliza a nota)" className="sm:col-span-2">
            <input
              value={customer.document}
              onChange={(e) => setCustomer({ document: formatDocument(e.target.value) })}
              className={inputClass}
              placeholder="000.000.000-00"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-deep">Endereço de entrega</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Field label="CEP" className="sm:col-span-2">
            <div className="relative">
              <input
                value={address.cep}
                onChange={(e) => setAddress({ cep: formatCep(e.target.value) })}
                onBlur={(e) => lookupCep(e.target.value)}
                className={inputClass}
                placeholder="29100-000"
                inputMode="numeric"
              />
              {cepLoading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink/40" />}
            </div>
          </Field>
          <Field label="Rua" className="sm:col-span-4">
            <input value={address.street} onChange={(e) => setAddress({ street: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Número" className="sm:col-span-2">
            <input value={address.number} onChange={(e) => setAddress({ number: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Complemento" className="sm:col-span-4">
            <input
              value={address.complement}
              onChange={(e) => setAddress({ complement: e.target.value })}
              className={inputClass}
              placeholder="Apto, bloco… (opcional)"
            />
          </Field>
          <Field label="Bairro" className="sm:col-span-3">
            <input value={address.neighborhood} onChange={(e) => setAddress({ neighborhood: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Cidade" className="sm:col-span-2">
            <input value={address.city} onChange={(e) => setAddress({ city: e.target.value })} className={inputClass} />
          </Field>
          <Field label="UF" className="sm:col-span-1">
            <select value={address.state} onChange={(e) => setAddress({ state: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {cepError && <p className="mt-2 text-[12px] text-garnet">{cepError}</p>}
      </div>

      <button
        onClick={() => (isValid ? onContinue() : setTouched(true))}
        className="w-full rounded-full bg-ink py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-rose disabled:opacity-50"
      >
        Continuar
      </button>
      {touched && !isValid && (
        <p className="text-center text-[12px] text-garnet">Confira se todos os campos obrigatórios estão preenchidos certinho.</p>
      )}
    </div>
  )
}
