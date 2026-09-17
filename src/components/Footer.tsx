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
    <footer id="contato" className="scroll-mt-28 bg-ivory-dim px-6 pb-8 pt-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 border-b border-taupe/70 pb-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src="/brand/logo-dark.png" alt="Karla Angel" className="h-5 w-auto" />
            <p className="font-script mt-2 text-xl text-taupe-deep">{content['footer.tagline']}</p>
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-ink/55">
              {content['footer.description']}
            </p>
          </div>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-taupe-deep">
              Institucional
            </p>
            <ul className="space-y-2 text-[14px] text-ink/70">
              <li><a href="#catalogo/semijoia" className="hover:text-rose-deep">Semijoia</a></li>
              <li><a href="#catalogo/joias" className="hover:text-rose-deep">Joias</a></li>
              <li><a href="#catalogo/moissanite" className="hover:text-rose-deep">Moissanite</a></li>
              <li><a href="#catalogo/noiva" className="hover:text-rose-deep">Noiva</a></li>
              <li><a href="#historia" className="hover:text-rose-deep">Nossa história</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-taupe-deep">
              Atendimento
            </p>
            <ul className="space-y-3 text-[14px] text-ink/70">
              <li>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-rose-deep">
                  <MessageCircle size={16} strokeWidth={1.5} /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-rose-deep">
                  <Mail size={16} strokeWidth={1.5} /> {email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-taupe-deep">
              Redes sociais
            </p>
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[14px] text-ink/70 hover:text-rose-deep">
              <InstagramIcon size={16} /> {instagramHandle}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[12px] text-ink/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Karla Angel Joias. Todos os direitos reservados.</p>
          <p>{content['footer.legal']}</p>
        </div>
      </div>
    </footer>
  )
}
