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
    <section className="bg-ink px-6 py-20 text-ivory lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="font-display text-3xl lg:text-4xl">
          Ganhe <span className="text-gold">10% off</span> na primeira compra
        </h2>
        <p className="mt-3 max-w-md text-[14px] text-ivory/60">
          Assine e receba lançamentos, cupons exclusivos e inspirações de
          estilo direto no seu e-mail.
        </p>

        {sent ? (
          <p className="mt-8 text-gold">Obrigada por assinar! Confira seu e-mail em breve. ✨</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-full border border-ivory/20 bg-transparent px-5 py-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-gold px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-bright"
            >
              Assinar
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
