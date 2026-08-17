import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Mail, MessageCircle, Save, Send, ShieldCheck, Smartphone, CheckCircle2, LogOut } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { getCurrentSubscription, getPushPermissionState, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import type { NotificationSettings, NotifyChannel, WhatsAppStatus } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const CHANNEL_LABELS: { value: NotifyChannel; label: string }[] = [
  { value: 'push', label: 'Push (navegador)' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export default function NotificationSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [globalThreshold, setGlobalThreshold] = useState(3)
  const [globalChannels, setGlobalChannels] = useState<NotifyChannel[]>([])
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')
  const [smtpFromEmail, setSmtpFromEmail] = useState('')
  const [smtpNotifyTo, setSmtpNotifyTo] = useState('')
  const [waNotifyNumber, setWaNotifyNumber] = useState('')

  const [testingEmail, setTestingEmail] = useState(false)
  const [testingWhatsapp, setTestingWhatsapp] = useState(false)
  const [testingPush, setTestingPush] = useState(false)
  const [pushState, setPushState] = useState<'unsupported' | 'default' | 'granted' | 'denied'>('default')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  // Estado da conexão do WhatsApp (QR code)
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null)
  const [waQr, setWaQr] = useState<string | null>(null)
  const [waConnecting, setWaConnecting] = useState(false)
  const [waDisconnecting, setWaDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load() {
    const data = await api.get<{ settings: NotificationSettings }>('/api/settings/notifications')
    setSettings(data.settings)
    setGlobalThreshold(data.settings.globalMinStockThreshold)
    setGlobalChannels(data.settings.globalNotifyChannels)
    setSmtpHost(data.settings.smtp.host)
    setSmtpPort(data.settings.smtp.port)
    setSmtpSecure(data.settings.smtp.secure)
    setSmtpUser(data.settings.smtp.user)
    setSmtpFromName(data.settings.smtp.fromName)
    setSmtpFromEmail(data.settings.smtp.fromEmail)
    setSmtpNotifyTo(data.settings.smtp.notifyToEmail)
    setWaNotifyNumber(data.settings.whatsappNotifyNumber)
    setLoading(false)

    const perm = await getPushPermissionState()
    setPushState(perm)
    const sub = await getCurrentSubscription()
    setPushSubscribed(!!sub)

    if (data.settings.whatsappServerConfigured) {
      refreshWhatsAppStatus()
    }
  }

  useEffect(() => {
    load()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function refreshWhatsAppStatus() {
    try {
      const status = await api.get<WhatsAppStatus>('/api/settings/whatsapp/status')
      setWaStatus(status)
      if (status.state === 'open' && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
        setWaQr(null)
      }
      return status
    } catch {
      return null
    }
  }

  async function handleConnectWhatsApp() {
    setWaConnecting(true)
    setError('')
    try {
      const qr = await api.post<{ base64: string | null; connected: boolean }>('/api/settings/whatsapp/connect')
      if (qr.connected) {
        setWaQr(null)
        await refreshWhatsAppStatus()
      } else {
        setWaQr(qr.base64)
        // Fica reconsultando o status a cada 3s até conectar (ou a
        // página ser fechada) — assim que o celular escaneia, o QR
        // some sozinho e mostra "conectado".
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(refreshWhatsAppStatus, 3000)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao gerar QR code.')
    } finally {
      setWaConnecting(false)
    }
  }

  async function handleDisconnectWhatsApp() {
    setWaDisconnecting(true)
    setError('')
    try {
      await api.post('/api/settings/whatsapp/disconnect')
      setWaQr(null)
      await refreshWhatsAppStatus()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao desconectar.')
    } finally {
      setWaDisconnecting(false)
    }
  }

  function toggleGlobalChannel(c: NotifyChannel) {
    setGlobalChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const data = await api.put<{ settings: NotificationSettings }>('/api/settings/notifications', {
        globalMinStockThreshold: globalThreshold,
        globalNotifyChannels: globalChannels,
        whatsappNotifyNumber: waNotifyNumber,
        smtp: {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          fromEmail: smtpFromEmail,
          notifyToEmail: smtpNotifyTo,
        },
      })
      setSettings(data.settings)
      setSmtpPass('')
      setMessage('Configurações salvas com sucesso.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true)
    setMessage('')
    setError('')
    try {
      await api.post('/api/settings/notifications/test-email')
      setMessage('E-mail de teste enviado — confira a caixa de entrada configurada.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao enviar e-mail de teste.')
    } finally {
      setTestingEmail(false)
    }
  }

  async function handleTestWhatsapp() {
    setTestingWhatsapp(true)
    setMessage('')
    setError('')
    try {
      await api.post('/api/settings/notifications/test-whatsapp')
      setMessage('Mensagem de teste enviada pelo WhatsApp.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao enviar WhatsApp de teste.')
    } finally {
      setTestingWhatsapp(false)
    }
  }

  async function handleTogglePush() {
    setPushBusy(true)
    setError('')
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush()
        setPushSubscribed(false)
      } else {
        await subscribeToPush()
        setPushSubscribed(true)
        setPushState('granted')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ativar push.')
    } finally {
      setPushBusy(false)
    }
  }

  async function handleTestPush() {
    setTestingPush(true)
    setMessage('')
    setError('')
    try {
      await api.post('/api/push/test')
      setMessage('Push de teste enviado — deve aparecer nos dispositivos com push ativado.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao enviar push de teste.')
    } finally {
      setTestingPush(false)
    }
  }

  if (loading || !settings) return <p className="text-ink/50">Carregando…</p>

  const canEdit = !!user?.canEdit
  const waConnected = waStatus?.state === 'open'

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Notificações de estoque</h1>
          <p className="mt-1 text-sm text-ink/55">
            Configure como você quer ser avisado quando um produto atingir o estoque mínimo.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Salvando…' : 'Salvar tudo'}
          </button>
        )}
      </div>

      {message && <p className="mb-6 rounded-lg bg-ink/5 px-4 py-2.5 text-[13px] text-ink">{message}</p>}
      {error && <p className="mb-6 rounded-lg bg-garnet/10 px-4 py-2.5 text-[13px] text-garnet">{error}</p>}

      <div className="space-y-8">
        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="mb-1 font-display text-lg text-ink">Padrão geral de estoque</h2>
          <p className="mb-5 text-[13px] text-ink/50">
            Usado para qualquer produto/categoria que não tenha uma configuração própria.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                Limite mínimo padrão
              </label>
              <input
                type="number"
                min={0}
                disabled={!canEdit}
                value={globalThreshold}
                onChange={(e) => setGlobalThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold disabled:bg-ivory-dim"
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">
                Canais de alerta padrão
              </label>
              <div className="flex flex-wrap gap-4">
                {CHANNEL_LABELS.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm text-ink/75">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={globalChannels.includes(c.value)}
                      onChange={() => toggleGlobalChannel(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <Bell size={18} className="text-gold" />
            <h2 className="font-display text-lg text-ink">Notificações push (neste dispositivo)</h2>
          </div>
          <p className="mb-5 text-[13px] text-ink/50">
            Ativa notificações diretamente no navegador/celular deste usuário — não depende de e-mail ou WhatsApp.
          </p>
          {!isPushSupported() || pushState === 'unsupported' ? (
            <p className="text-[13px] text-ink/50">Este navegador não suporta notificações push.</p>
          ) : pushState === 'denied' ? (
            <p className="text-[13px] text-garnet">
              Notificações bloqueadas nas configurações do navegador. Permita notificações para este site e recarregue a página.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleTogglePush}
                disabled={pushBusy}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                  pushSubscribed
                    ? 'border border-garnet/40 text-garnet hover:bg-garnet/10'
                    : 'bg-gold text-ink hover:bg-gold-bright'
                }`}
              >
                {pushSubscribed ? <BellOff size={14} /> : <Bell size={14} />}
                {pushBusy ? 'Aguarde…' : pushSubscribed ? 'Desativar push' : 'Ativar push neste dispositivo'}
              </button>
              {pushSubscribed && (
                <button
                  onClick={handleTestPush}
                  disabled={testingPush}
                  className="flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink/70 hover:border-gold hover:text-gold"
                >
                  <Send size={14} /> {testingPush ? 'Enviando…' : 'Enviar teste'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <Mail size={18} className="text-gold" />
            <h2 className="font-display text-lg text-ink">E-mail (SMTP)</h2>
          </div>
          <p className="mb-5 text-[13px] text-ink/50">
            Dados do servidor de e-mail usado para enviar os alertas de estoque baixo.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Servidor SMTP (host)" value={smtpHost} onChange={setSmtpHost} disabled={!canEdit} placeholder="smtp.seuservidor.com" />
            <Field label="Porta" type="number" value={String(smtpPort)} onChange={(v) => setSmtpPort(Number(v))} disabled={!canEdit} />
            <Field label="Usuário" value={smtpUser} onChange={setSmtpUser} disabled={!canEdit} placeholder="seu@email.com" />
            <Field
              label={settings.smtp.passSet ? 'Senha (preenchida — deixe em branco pra manter)' : 'Senha'}
              type="password"
              value={smtpPass}
              onChange={setSmtpPass}
              disabled={!canEdit}
              placeholder={settings.smtp.passSet ? '••••••••' : ''}
            />
            <Field label="Nome do remetente" value={smtpFromName} onChange={setSmtpFromName} disabled={!canEdit} />
            <Field label="E-mail do remetente" value={smtpFromEmail} onChange={setSmtpFromEmail} disabled={!canEdit} />
            <label className="flex items-center gap-2 text-sm text-ink/75 sm:col-span-2">
              <input type="checkbox" disabled={!canEdit} checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
              Conexão segura (SSL/TLS) — normalmente usado na porta 465
            </label>
            <Field
              label="E-mail de destino dos alertas"
              value={smtpNotifyTo}
              onChange={setSmtpNotifyTo}
              disabled={!canEdit}
              placeholder="dono@karlaangeljoias.com.br"
              className="sm:col-span-2"
            />
          </div>
          {canEdit && (
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="mt-4 flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink/70 hover:border-gold hover:text-gold"
            >
              <Send size={14} /> {testingEmail ? 'Enviando…' : 'Enviar e-mail de teste'}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <MessageCircle size={18} className="text-gold" />
            <h2 className="font-display text-lg text-ink">WhatsApp</h2>
          </div>
          <p className="mb-5 text-[13px] text-ink/50">
            Conecte um número de WhatsApp escaneando o QR code — igual conectar o WhatsApp Web. Não é a API oficial
            da Meta; é a mesma tecnologia usada no VBMA, mas com uma conexão própria da Karla Angel Joias.
          </p>

          {!settings.whatsappServerConfigured ? (
            <p className="rounded-lg bg-ivory-dim px-4 py-3 text-[13px] text-ink/60">
              O servidor ainda não tem a integração de WhatsApp habilitada. Isso é configurado uma vez pelo
              administrador do servidor (fora do painel).
            </p>
          ) : waConnected ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-[13px] font-semibold text-green-700">
                <CheckCircle2 size={16} /> WhatsApp conectado
              </span>
              {canEdit && (
                <button
                  onClick={handleDisconnectWhatsApp}
                  disabled={waDisconnecting}
                  className="flex items-center gap-2 rounded-full border border-garnet/30 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-garnet hover:bg-garnet/10"
                >
                  <LogOut size={14} /> {waDisconnecting ? 'Desconectando…' : 'Desconectar'}
                </button>
              )}
            </div>
          ) : (
            <div>
              {waQr ? (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <img
                    src={`data:image/png;base64,${waQr.replace(/^data:image\/\w+;base64,/, '')}`}
                    alt="QR code do WhatsApp"
                    className="h-48 w-48 rounded-lg border border-ink/10"
                  />
                  <p className="max-w-xs text-[13px] text-ink/60">
                    Abra o WhatsApp no celular que vai enviar os alertas → Configurações → Aparelhos conectados →
                    Conectar um aparelho, e escaneie este código.
                  </p>
                </div>
              ) : (
                canEdit && (
                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={waConnecting}
                    className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-gold-bright disabled:opacity-50"
                  >
                    <Smartphone size={14} /> {waConnecting ? 'Gerando QR code…' : 'Conectar WhatsApp'}
                  </button>
                )
              )}
            </div>
          )}

          <div className="mt-5 border-t border-ink/10 pt-5">
            <Field
              label="Número de destino dos alertas (com DDI e DDD)"
              value={waNotifyNumber}
              onChange={setWaNotifyNumber}
              disabled={!canEdit}
              placeholder="5527999999999"
            />
            {canEdit && waConnected && (
              <button
                onClick={handleTestWhatsapp}
                disabled={testingWhatsapp}
                className="mt-4 flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink/70 hover:border-gold hover:text-gold"
              >
                <Send size={14} /> {testingWhatsapp ? 'Enviando…' : 'Enviar WhatsApp de teste'}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-ink/10 bg-ivory-dim p-4 text-[12px] text-ink/50">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" />
          Senha do SMTP nunca é reexibida depois de salva — só mostramos se já está configurada ou não. Pra trocar,
          digite o novo valor; pra manter o atual, deixe o campo em branco.
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink/50">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-gold disabled:bg-ivory-dim"
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
    </div>
  )
}
