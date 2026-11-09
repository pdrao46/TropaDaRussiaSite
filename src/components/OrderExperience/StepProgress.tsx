import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { ORDER_STEPS, type OrderStep } from '../../context/OrderUIContext';

export const STEP_LABELS: Record<OrderStep, string> = {
  produtos: 'Produtos',
  carrinho: 'Carrinho',
  modalidade: 'Modalidade',
  identificacao: 'Identificação',
  revisao: 'Revisão',
};

interface Props {
  current: OrderStep;
  maxReached: number;
  onSelect: (step: OrderStep) => void;
}

/** Indicador de progresso das 5 etapas. Permite voltar para etapas já visitadas. */
export function StepProgress({ current, maxReached, onSelect }: Props) {
  const currentIndex = ORDER_STEPS.indexOf(current);
  return (
    <nav aria-label="Etapas da encomenda" className="w-full">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {ORDER_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const reachable = i <= maxReached && !active;
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(step)}
                aria-current={active ? 'step' : undefined}
                className="group flex min-w-0 items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300 ${
                    active ? 'border-ru-red bg-ru-red text-white' : done ? 'border-ru-blue bg-ru-blue text-white' : 'border-white/20 bg-white/5 text-steel'
                  } ${reachable ? 'group-hover:border-white/70' : ''}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                  {active && <motion.span layoutId="step-ring" className="absolute -inset-1 rounded-full border border-ru-red/60" />}
                </span>
                <span className={`text-display hidden truncate text-[11px] tracking-[0.18em] lg:block ${active ? 'text-white' : 'text-steel'}`}>
                  {STEP_LABELS[step]}
                </span>
              </button>
              {i < ORDER_STEPS.length - 1 && (
                <span className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-ru-blue to-ru-red"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-display mt-2 text-[11px] tracking-[0.25em] text-steel lg:hidden">
        Etapa {currentIndex + 1} de {ORDER_STEPS.length} — <span className="text-white">{STEP_LABELS[current]}</span>
      </p>
    </nav>
  );
}
