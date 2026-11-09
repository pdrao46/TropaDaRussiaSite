import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useOrderUI } from '../../hooks/useOrderUI';
import { formatBRL } from '../../lib/pricing';

/** Atalho flutuante para o carrinho quando há itens e a encomenda está fechada. */
export function FloatingCartButton() {
  const { units, total } = useCart();
  const { isOpen, openOrder } = useOrderUI();
  const visible = units > 0 && !isOpen;
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => openOrder('carrinho')}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="glass sheen fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[min(92vw,380px)] -translate-x-1/2 items-center gap-3 rounded-2xl py-2.5 pl-3 pr-4 text-left shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] sm:left-auto sm:right-6 sm:translate-x-0"
          aria-label={`Abrir carrinho: ${units} itens, total ${formatBRL(total)}`}
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-ru-red">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <motion.span key={units} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-ru-red">
              {units}
            </motion.span>
          </span>
          <span className="flex-1">
            <span className="text-display block text-[11px] tracking-[0.25em] text-steel">Seu carrinho</span>
            <span className="block font-bold tabular-nums">{formatBRL(total)}</span>
          </span>
          <span className="text-display flex items-center gap-1 text-xs font-semibold tracking-[0.15em] text-white/90">
            Continuar <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
