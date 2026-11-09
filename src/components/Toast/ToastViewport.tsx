import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const toneStyles = {
  success: { icon: CheckCircle2, bar: 'bg-ru-blue', iconColor: 'text-ru-blue-light' },
  info: { icon: Info, bar: 'bg-white', iconColor: 'text-white' },
  warning: { icon: TriangleAlert, bar: 'bg-ru-red', iconColor: 'text-ru-red-light' },
} as const;

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const s = toneStyles[t.tone];
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="glass pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl py-3 pl-4 pr-10 shadow-2xl"
              role="status"
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} aria-hidden="true" />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconColor}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-steel">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="absolute right-2 top-2 rounded-md p-1 text-steel hover:text-white" aria-label="Fechar aviso">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
