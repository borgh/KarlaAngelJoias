import { MessageCircle, Mail } from 'lucide-react'
import { InstagramIcon } from './icons/InstagramIcon'
import { useSiteData } from '../context/SiteDataContext'
import { buildWhatsappUrl } from '../data/site'

export function Footer() {
  const { content } = useSiteData()
  const whatsappUrl = buildWhatsappUrl(content)
  const instagramUrl = content['contact.instagram_url']
  const instagramHandle = content['contact.instagram_handle']
  const email = content['contact.email']
  return (
    <footer id="contato" className="bg-ivory px-6 pb-8 pt-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 border-b border-ink/10 pb-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl text-ink">Karla Angel Joias</p>
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-ink/55">
              Semijoias autorais com acabamento de joalheria, para o brilho
              do seu dia a dia.
            </p>
          </div>

          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Institucional
            </p>
            <ul className="space-y-2 text-[14px] text-ink/70">
              <li><a href="#historia" className="hover:text-gold">Nossa história</a></li>
              <li><a href="#colecoes" className="hover:text-gold">Coleções</a></li>
              <li><a href="#mais-vendidos" className="hover:text-gold">Mais vendidos</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Atendimento
            </p>
            <ul className="space-y-3 text-[14px] text-ink/70">
              <li>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold">
                  <MessageCircle size={16} strokeWidth={1.5} /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-gold">
                  <Mail size={16} strokeWidth={1.5} /> {email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Redes sociais
            </p>
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[14px] text-ink/70 hover:text-gold">
              <InstagramIcon size={16} /> {instagramHandle}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[12px] text-ink/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Karla Angel Joias. Todos os direitos reservados.</p>
          <p>CNPJ: 00.000.000/0001-00 · em preenchimento</p>
        </div>
      </div>
    </footer>
  )
}
