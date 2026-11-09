import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onAdd: () => void;
  label?: string;
  className?: string;
  ariaLabel: string;
  compact?: boolean;
}

/** Botão "adicionar" com microfeedback (ícone vira check por um instante). */
export function AddToCartButton({ onAdd, label = 'Adicionar', className = '', ariaLabel, compact = false }: Props) {
  const [done, setDone] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        onAdd();
        setDone(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setDone(false), 1200);
      }}
      aria-label={ariaLabel}
      className={`sheen inline-flex items-center justify-center gap-2 rounded-lg border font-display text-[13px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,box-shadow] duration-300 ${
        done
          ? 'border-ru-blue-light/60 bg-ru-blue text-white shadow-[0_0_24px_-6px_rgba(0,87,184,1)]'
          : 'border-white/15 bg-white/[0.06] text-white hover:border-ru-red/70 hover:bg-ru-red hover:shadow-[0_0_24px_-6px_rgba(213,43,30,1)]'
      } ${compact ? 'h-10 w-10' : 'h-10 px-4'} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ? 'ok' : 'add'}
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="flex"
        >
          {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
      {!compact && <span>{done ? 'Adicionado' : label}</span>}
    </motion.button>
  );
}
