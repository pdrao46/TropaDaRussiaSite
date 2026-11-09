import { AnimatePresence, motion } from 'motion/react';
import { Handshake } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatBRL } from '../../lib/pricing';

/** Bloco de total geral com animação de atualização. */
export function CartTotal({ className = '' }: { className?: string }) {
  const { total, units, state, partnerSavings } = useCart();
  const partner = state.partnership === 'com_parceria';
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-br from-navy to-graphite p-4 ${className}`}>
      <div className="flex items-center justify-between text-xs text-steel">
        <span>{units} {units === 1 ? 'unidade' : 'unidades'}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ${partner ? 'bg-ru-blue/20 text-ru-blue-light' : 'bg-white/10 text-white/80'}`}>
          {partner && <Handshake className="h-3 w-3" aria-hidden="true" />}
          {partner ? 'Com parceria' : 'Sem parceria'}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-display text-sm tracking-[0.25em] text-steel">Total</span>
        <span className="relative h-9 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={total}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-display block text-3xl font-bold tabular-nums text-white"
            >
              {formatBRL(total)}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      {!partner && partnerSavings > 0 && (
        <p className="mt-2 text-[11px] text-steel">
          Com parceria, este carrinho sairia por <span className="font-semibold text-ru-blue-light">{formatBRL(total - partnerSavings)}</span>.
        </p>
      )}
      {partner && partnerSavings > 0 && (
        <p className="mt-2 text-[11px] text-ru-blue-light">Economia de parceria: {formatBRL(partnerSavings)} (sujeita à validação).</p>
      )}
      <span className="tricolor mt-3 block h-[2px] w-full rounded-full opacity-80" aria-hidden="true" />
    </div>
  );
}
