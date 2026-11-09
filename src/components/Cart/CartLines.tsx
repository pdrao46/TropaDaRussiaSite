import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, Trash } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatBRL } from '../../lib/pricing';
import { PRODUCT_ICONS } from '../Catalog/productVisuals';
import { QuantityStepper } from '../ui/QuantityStepper';

/** Lista de itens do carrinho com quantidade, unitário, subtotal e remoção. */
export function CartLines({ compact = false, onEmptyAction }: { compact?: boolean; onEmptyAction?: () => void }) {
  const { items, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
        <ShoppingBag className="h-8 w-8 text-steel/60" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-white">Seu carrinho está vazio</p>
        <p className="mt-1 text-xs text-steel">Adicione itens do catálogo para montar a encomenda.</p>
        {onEmptyAction && (
          <button type="button" onClick={onEmptyAction} className="text-display mt-4 text-xs font-semibold tracking-[0.2em] text-ru-blue-light underline-offset-4 hover:underline">
            Escolher produtos
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2.5" aria-label="Itens no carrinho">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const Icon = PRODUCT_ICONS[item.productId];
          return (
            <motion.li
              key={item.productId}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.28 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] ${compact ? 'p-3' : 'p-3 sm:p-4'}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-display truncate text-[15px] font-medium tracking-[0.06em]">{item.name}</p>
                  <p className="text-xs tabular-nums text-steel">{formatBRL(item.unitPrice)} / un.</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="rounded-md p-2 text-steel transition-colors hover:bg-ru-red/15 hover:text-ru-red-light"
                  aria-label={`Remover ${item.name} do carrinho`}
                >
                  <Trash className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <QuantityStepper
                  size="sm"
                  min={0}
                  value={item.quantity}
                  onChange={(q) => (q < 1 ? remove(item.productId) : setQuantity(item.productId, q))}
                  label={item.name}
                />
                <motion.span key={item.subtotal} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-right font-semibold tabular-nums">
                  <span className="sr-only">Subtotal: </span>
                  {formatBRL(item.subtotal)}
                </motion.span>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
