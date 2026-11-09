import { Trash } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { StepHeader } from '../OrderExperience/StepHeader';
import { CartLines } from './CartLines';
import { CartTotal } from './CartTotal';

export function CartStep({ onBrowse }: { onBrowse: () => void }) {
  const { items, clear } = useCart();
  return (
    <div>
      <StepHeader step={2} title="Carrinho" description="Ajuste as quantidades ou remova itens. Os valores são recalculados automaticamente." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <CartLines onEmptyAction={onBrowse} />
          {items.length > 0 && (
            <div className="mt-3 flex justify-between">
              <button type="button" onClick={onBrowse} className="text-display text-xs font-semibold tracking-[0.18em] text-ru-blue-light hover:underline">
                + Adicionar mais itens
              </button>
              <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-xs text-steel hover:text-ru-red-light">
                <Trash className="h-3.5 w-3.5" aria-hidden="true" /> Esvaziar carrinho
              </button>
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-0 lg:self-start">
          <CartTotal />
        </div>
      </div>
    </div>
  );
}
