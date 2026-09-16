import { useState, type FormEvent } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    // Front-end apenas: conectar a um provedor real (Mailchimp, RD Station,
    // Klaviyo etc.) antes do lançamento em produção.
    setSent(true)
  }

  return (
    <section className="bg-rose px-6 py-20 text-white lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white/80">Newsletter</p>
        <h2 className="font-display text-3xl font-light tracking-[0.04em] lg:text-4xl">
          Ganhe <span className="font-normal">10% off</span> na primeira compra
        </h2>
        <p className="mt-3 max-w-md text-[14px] text-white/85">
          Assine e receba lançamentos, cupons exclusivos e inspirações de
          estilo direto no seu e-mail.
        </p>

        {sent ? (
          <p className="mt-8 text-white">Obrigada por assinar! Confira seu e-mail em breve. ✨</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-full border border-white/50 bg-white/15 px-5 py-3 text-sm text-white outline-none placeholder:text-white/60 focus:border-white focus:bg-white/25"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-rose-deep transition-colors hover:bg-ivory"
            >
              Assinar
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
