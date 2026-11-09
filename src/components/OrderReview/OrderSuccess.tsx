/**
 * Confirmação REAL de encomenda — exibida somente quando o backend devolve
 * um número de pedido verdadeiro (TDR-000001). Nunca é mostrada sem orderId.
 *
 * Visual construído com a mesma linguagem do resto do site (símbolo, tricolor,
 * tipografia e botões já existentes).
 */
import { motion } from 'motion/react';
import { Check, Copy, PackageCheck, X } from 'lucide-react';
import { useState } from 'react';
import { formatBRL } from '../../lib/pricing';
import { media } from '../../assets';
import { Button } from '../ui/Button';

interface Props {
  orderId: string;
  message?: string;
  warnings?: string[];
  total: number;
  priceMode?: string;
  onClose: () => void;
}

export function OrderSuccess({ orderId, message, warnings = [], total, priceMode, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex max-w-xl flex-col items-center py-6 text-center sm:py-12"
      role="alertdialog"
      aria-labelledby="success-title"
      aria-describedby="success-desc"
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-ru-blue/30 blur-3xl" aria-hidden="true" />
        <img src={media.logos.simbolo} alt="" aria-hidden="true" className="w-28 opacity-90 sm:w-36" />
        <span className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-graphite bg-emerald-500">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <span className="tricolor mt-8 block h-[3px] w-24 rounded-full" aria-hidden="true" />

      <h2 id="success-title" className="text-display mt-6 text-2xl font-bold tracking-[0.14em] sm:text-3xl">
        Encomenda registrada
      </h2>

      <p id="success-desc" className="mt-4 text-[15px] leading-relaxed text-steel">
        {message ?? 'Sua encomenda foi enviada à equipe da TROPA DA RÚSSIA e já está na fila de atendimento.'}
      </p>

      <div className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-steel">Número do pedido</p>
        <p className="text-display mt-1 text-3xl font-bold tracking-[0.12em] text-ru-white">{orderId}</p>
        <p className="mt-2 text-xs text-steel">
          Guarde este número. Use-o para acompanhar o status com a equipe.
        </p>
      </div>

      <p className="mt-4 text-sm text-steel">
        Total em moeda do jogo:{' '}
        <strong className="text-ru-white">{formatBRL(total)}</strong>
        {priceMode === 'parceria' ? <span className="text-steel"> • modalidade parceria</span> : null}
      </p>

      {warnings.length > 0 ? (
        <ul className="mt-4 w-full space-y-2 text-left">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="rounded-lg border border-ru-blue/30 bg-ru-blue/10 px-4 py-2 text-xs leading-relaxed text-steel"
            >
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          variant="outline"
          icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          onClick={copy}
        >
          {copied ? 'Código copiado' : 'Copiar código'}
        </Button>
        <Button variant="blue" icon={<X className="h-4 w-4" />} onClick={onClose}>
          Fechar
        </Button>
      </div>
    </motion.div>
  );
}
