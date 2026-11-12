import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MAX_QUANTITY } from '../../lib/pricing';

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Valor mínimo alcançável pelo botão "−" (0 permite remover no carrinho). */
  min?: number;
  label: string;
  size?: 'sm' | 'md';
}

/** Seletor de quantidade: aceita apenas inteiros positivos (sem negativos/decimais). */
export function QuantityStepper({ value, onChange, min = 1, label, size = 'md' }: Props) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      setDraft(String(value)); // entrada inválida: volta ao último valor válido
      return;
    }
    const clamped = Math.min(n, MAX_QUANTITY);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const h = size === 'sm' ? 'h-9' : 'h-10';
  const btn = `flex ${h} w-9 items-center justify-center text-steel transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent`;

  return (
    <div role="group" aria-label={label} className={`inline-flex ${h} items-stretch overflow-hidden rounded-lg border border-white/12 bg-black/25`}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Diminuir quantidade de ${label}`}>
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
          if (['-', '+', '.', ',', 'e', 'E'].includes(e.key)) e.preventDefault();
        }}
        aria-label={`Quantidade de ${label}`}
        className="w-10 border-x border-white/10 bg-transparent text-center text-sm font-semibold tabular-nums text-white outline-none focus:bg-white/5"
      />
      <button type="button" className={btn} onClick={() => onChange(Math.min(MAX_QUANTITY, value + 1))} disabled={value >= MAX_QUANTITY} aria-label={`Aumentar quantidade de ${label}`}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
