import { AnimatePresence, motion } from 'motion/react';
import { Handshake, Info, Users, UserRound } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatBRL, calculateItems, calculateTotal } from '../../lib/pricing';
import type { PartnershipType } from '../../types/Order';
import { StepHeader } from '../OrderExperience/StepHeader';
import { TextField } from './Field';

const OPTIONS: Array<{ value: PartnershipType; title: string; text: string; icon: typeof Handshake; accent: string }> = [
  { value: 'sem_parceria', title: 'Sem parceria', text: 'Valores padrão do catálogo oficial.', icon: UserRound, accent: 'red' },
  { value: 'com_parceria', title: 'Com parceria', text: 'Valores especiais para facções parceiras.', icon: Handshake, accent: 'blue' },
];

export function PartnershipStep({ partnerError }: { partnerError?: string }) {
  const { state, setPartnership, setPartnerFaction } = useCart();
  const isPartner = state.partnership === 'com_parceria';

  return (
    <div>
      <StepHeader step={3} title="Modalidade de preço" description="Selecione a modalidade. Todos os valores do carrinho são recalculados imediatamente." />
      <div role="radiogroup" aria-label="Modalidade de preço" className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {OPTIONS.map((opt) => {
          const active = state.partnership === opt.value;
          const total = calculateTotal(calculateItems(state.items, opt.value));
          const blue = opt.accent === 'blue';
          return (
            <motion.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPartnership(opt.value)}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300 ${
                active
                  ? blue
                    ? 'border-ru-blue bg-ru-blue/15 shadow-[0_0_40px_-12px_rgba(0,87,184,0.9)]'
                    : 'border-ru-red bg-ru-red/10 shadow-[0_0_40px_-12px_rgba(213,43,30,0.9)]'
                  : 'border-white/12 bg-white/[0.03] hover:border-white/30'
              }`}
            >
              {active && <motion.span layoutId="mode-glow" className={`absolute inset-x-0 top-0 h-[3px] ${blue ? 'bg-ru-blue' : 'bg-ru-red'}`} />}
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${blue ? 'bg-ru-blue/25 text-ru-blue-light' : 'bg-ru-red/20 text-ru-red-light'}`}>
                  <opt.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? (blue ? 'border-ru-blue-light' : 'border-ru-red-light') : 'border-white/30'}`} aria-hidden="true">
                  {active && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`h-2.5 w-2.5 rounded-full ${blue ? 'bg-ru-blue-light' : 'bg-ru-red-light'}`} />}
                </span>
              </div>
              <h3 className="text-display mt-4 text-xl font-semibold tracking-[0.14em]">{opt.title}</h3>
              <p className="mt-1 text-sm text-steel">{opt.text}</p>
              <p className="mt-4 text-xs text-steel">
                Total do carrinho: <span className="text-base font-bold tabular-nums text-white">{formatBRL(total)}</span>
              </p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {isPartner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4">
              <div className="flex gap-3 rounded-xl border border-ru-blue/40 bg-ru-blue/10 p-4 text-sm text-white/90" role="note">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ru-blue-light" aria-hidden="true" />
                <p>Os valores de parceria estão sujeitos à validação da equipe responsável.</p>
              </div>
              <TextField
                label="Nome da facção parceira"
                icon={<Users className="h-4 w-4" />}
                required
                placeholder="Ex.: Família Vermelha"
                value={state.partnerFaction}
                maxLength={40}
                onChange={(e) => setPartnerFaction(e.target.value)}
                error={partnerError}
                valid={!partnerError && state.partnerFaction.trim().length >= 2}
                autoComplete="off"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
