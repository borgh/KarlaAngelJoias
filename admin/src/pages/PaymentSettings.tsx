import { useEffect, useState } from 'react'
import { CreditCard, Truck, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { NotificationSettings } from '../lib/types'

export default function PaymentSettings() {
  const [settings, setSettings] = useState<NotificationSettings['mercadopago'] | null>(null)
  const [shipping, setShipping] = useState<NotificationSettings['shipping'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [mode, setMode] = useState<'sandbox' | 'production'>('sandbox')
  const [sandboxPublicKey, setSandboxPublicKey] = useState('')
  const [sandboxAccessToken, setSandboxAccessToken] = useState('')
  const [productionPublicKey, setProductionPublicKey] = useState('')
  const [productionAccessToken, setProductionAccessToken] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [flatRate, setFlatRate] = useState('15,00')
  const [freeAbove, setFreeAbove] = useState('300,00')

  async function load() {
    try {
      const data = await api.get<{ settings: NotificationSettings }>('/api/settings/notifications')
      setSettings(data.settings.mercadopago)
      setShipping(data.settings.shipping)
      setMode(data.settings.mercadopago.mode)
      setSandboxPublicKey(data.settings.mercadopago.sandboxPublicKey)
      setProductionPublicKey(data.settings.mercadopago.productionPublicKey)
      setFlatRate((data.settings.shipping.flatRateCents / 100).toFixed(2).replace('.', ','))
      setFreeAbove((data.settings.shipping.freeAboveCents / 100).toFixed(2).replace('.', ','))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toCents(value: string) {
    const n = Number(value.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? Math.round(n * 100) : 0
  }

  async function save() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const body: Record<string, unknown> = {
        mode,
        sandboxPublicKey,
        productionPublicKey,
        flatRateCents: toCents(flatRate),
        freeAboveCents: toCents(freeAbove),
      }
      // Só manda os campos de token/segredo se a pessoa digitou algo —
      // campo em branco mantém o valor já salvo (nunca aparece de volta
      // na tela, por segurança, mas continua funcionando até ser trocado).
      if (sandboxAccessToken) body.sandboxAccessToken = sandboxAccessToken
      if (productionAccessToken) body.productionAccessToken = productionAccessToken
      if (webhookSecret) body.webhookSecret = webhookSecret

      const data = await api.put<{ settings: NotificationSettings }>('/api/settings/payments', body)
      setSettings(data.settings.mercadopago)
      setShipping(data.settings.shipping)
      setSandboxAccessToken('')
      setProductionAccessToken('')
      setWebhookSecret('')
      setMessage('Configurações salvas.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings || !shipping) return <p className="text-ink/50">Carregando…</p>

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Pagamentos</h1>
        <p className="mt-1 text-sm text-ink/55">
          Configure o Mercado Pago para os clientes comprarem direto no site, sem sair pro WhatsApp.
        </p>
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
          settings.configured ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        {settings.configured ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <ShieldAlert size={18} className="mt-0.5 shrink-0" />}
        <div>
          <p className="font-medium">{settings.configured ? 'Pagamento pelo site está ativo' : 'Pagamento pelo site ainda não está ativo'}</p>
          <p className="mt-0.5 text-[13px] opacity-80">
            {settings.configured
              ? `Usando as chaves de ${mode === 'production' ? 'produção (cobranças reais)' : 'teste (sandbox — nenhuma cobrança real)'}.`
              : 'Cadastre as chaves abaixo. Até lá, o checkout do site mostra que o pagamento está temporariamente indisponível — os clientes continuam podendo comprar pelo WhatsApp normalmente.'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <p className="mb-1 flex items-center gap-2 font-display text-lg text-ink">
          <CreditCard size={18} className="text-gold" /> Mercado Pago
        </p>
        <p className="mb-5 text-[13px] text-ink/55">
          As chaves ficam em{' '}
          <a
            href="https://www.mercadopago.com.br/developers/panel/app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-rose-deep underline underline-offset-2"
          >
            Mercado Pago Developers <ExternalLink size={12} />
          </a>{' '}
          → sua aplicação → Credenciais. Teste primeiro em <strong>sandbox</strong>; só troque pra{' '}
          <strong>produção</strong> depois de confirmar uma compra de teste de ponta a ponta.
        </p>

        <div className="mb-5 flex rounded-full border border-ink/15 p-1">
          {(['sandbox', 'production'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                mode === m ? 'bg-rose text-white' : 'text-ink/55'
              }`}
            >
              {m === 'sandbox' ? 'Teste (sandbox)' : 'Produção (real)'}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink/45">Credenciais de teste</p>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Public Key (teste)</label>
            <input
              value={sandboxPublicKey}
              onChange={(e) => setSandboxPublicKey(e.target.value)}
              placeholder="TEST-00000000-0000-0000-0000-000000000000"
              className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
              Access Token (teste) {settings.sandboxAccessTokenSet && <span className="text-green-600">— já configurado</span>}
            </label>
            <input
              type="password"
              value={sandboxAccessToken}
              onChange={(e) => setSandboxAccessToken(e.target.value)}
              placeholder={settings.sandboxAccessTokenSet ? '•••••••••••••••• (deixe em branco pra manter)' : 'TEST-0000000000000000-000000-...'}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>

          <div className="border-t border-ink/10 pt-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink/45">Credenciais de produção</p>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Public Key (produção)</label>
            <input
              value={productionPublicKey}
              onChange={(e) => setProductionPublicKey(e.target.value)}
              placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
              className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
              Access Token (produção) {settings.productionAccessTokenSet && <span className="text-green-600">— já configurado</span>}
            </label>
            <input
              type="password"
              value={productionAccessToken}
              onChange={(e) => setProductionAccessToken(e.target.value)}
              placeholder={settings.productionAccessTokenSet ? '•••••••••••••••• (deixe em branco pra manter)' : 'APP_USR-0000000000000000-000000-...'}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>

          <div className="border-t border-ink/10 pt-5">
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
              Chave secreta do webhook (opcional) {settings.webhookSecretSet && <span className="text-green-600">— já configurado</span>}
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={settings.webhookSecretSet ? '•••••••••••••••• (deixe em branco pra manter)' : 'Em Webhooks → detalhes da assinatura'}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <p className="mt-1 text-[11px] text-ink/40">
              Confirma que a notificação de pagamento realmente veio do Mercado Pago. Sem ela, o sistema ainda funciona
              (confere o pagamento direto na API do MP), só fica um pouco menos protegido contra notificações falsas.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <p className="mb-5 flex items-center gap-2 font-display text-lg text-ink">
          <Truck size={18} className="text-gold" /> Frete
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Valor fixo (R$)</label>
            <input
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Grátis a partir de (R$)</label>
            <input
              value={freeAbove}
              onChange={(e) => setFreeAbove(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink/40">
          Frete simples por enquanto (sem integração com transportadora) — valor fixo, ou grátis quando o pedido passa
          desse valor. Deixe "grátis a partir de" como 0 se nunca quiser oferecer frete grátis.
        </p>
      </section>

      {message && <p className="text-[13px] text-green-700">{message}</p>}
      {error && <p className="text-[13px] text-garnet">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-full bg-rose py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}
