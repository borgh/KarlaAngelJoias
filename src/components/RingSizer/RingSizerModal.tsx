import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Keyboard, MonitorSmartphone, Camera } from 'lucide-react'
import { ManualTab } from './ManualTab'
import { ScreenTab } from './ScreenTab'
import { CameraTab } from './CameraTab'

type Tab = 'camera' | 'screen' | 'manual'

const TABS: { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: 'camera', label: 'Câmera com IA', icon: Camera },
  { id: 'screen', label: 'Anel na tela', icon: MonitorSmartphone },
  { id: 'manual', label: 'Já sei a medida', icon: Keyboard },
]

export function RingSizerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('camera')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-ink text-ivory shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ivory/10 bg-ink px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Guia de medidas</p>
                <h2 className="font-display text-xl">Descubra o tamanho do seu anel</h2>
              </div>
              <button onClick={onClose} aria-label="Fechar" className="text-ivory/50 hover:text-ivory">
                <X size={22} />
              </button>
            </div>

            <div className="flex gap-1 border-b border-ivory/10 px-4 pt-3">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:text-[12px] ${
                    tab === t.id ? 'border-b-2 border-gold text-gold' : 'text-ivory/45 hover:text-ivory/70'
                  }`}
                >
                  <t.icon size={15} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="px-6 py-8">
              {tab === 'camera' && <CameraTab />}
              {tab === 'screen' && <ScreenTab />}
              {tab === 'manual' && <ManualTab />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
