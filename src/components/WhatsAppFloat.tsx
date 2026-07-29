import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { WHATSAPP_URL } from '../data/site'

export function WhatsAppFloat() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:scale-110"
    >
      <MessageCircle size={26} strokeWidth={1.6} fill="white" />
    </motion.a>
  )
}
