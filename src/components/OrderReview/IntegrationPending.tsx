import { motion } from 'motion/react';
import { ArrowLeft, Check, Copy, Construction, X } from 'lucide-react';
import { useState } from 'react';
import type { OrderDraft } from '../../types/Order';
import { formatBRL } from '../../lib/pricing';
import { media } from '../../assets';
import { Button } from '../ui/Button';

function summaryText(draft: OrderDraft): string {
  const lines = [
    'ENCOMENDA — TROPA DA RÚSSIA (rascunho, não enviado)',
    `Personagem: ${draft.customer.characterName} | ID ${draft.customer.characterId}`,
    `Facção: ${draft.customer.factionName} | Telefone RP: ${draft.customer.phoneRp}`,
    `Discord: ${draft.customer.discordUser}${draft.customer.discordId ? ` (${draft.customer.discordId})` : ''}`,
    `Modalidade: ${draft.partnership === 'com_parceria' ? `Com parceria${draft.partnerFaction ? ` (${draft.partnerFaction})` : ''}` : 'Sem parceria'}`,
    '',
    ...draft.items.map((i) => `${i.quantity}× ${i.name} — ${formatBRL(i.unitPrice)} = ${formatBRL(i.subtotal)}`),
    '',
    `TOTAL: ${formatBRL(draft.total)}`,
  ];
  if (draft.customer.notes) lines.push(`Obs.: ${draft.customer.notes}`);
  return lines.join('\n');
}

interface Props {
  message: string;
  draft: OrderDraft;
  onBack: () => void;
  onClose: () => void;
}

/** Estado temporário do botão CONFIRMAR: nenhuma encomenda é enviada nesta etapa. */
export function IntegrationPending({ message, draft, onBack, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(draft));
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
      aria-labelledby="pending-title"
      aria-describedby="pending-desc"
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-ru-blue/30 blur-3xl" aria-hidden="true" />
        <img src={media.logos.simbolo} alt="" aria-hidden="true" className="w-28 opacity-90 sm:w-36" />
        <span className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-graphite bg-ru-red">
          <Construction className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <span className="tricolor mt-8 block h-[3px] w-24 rounded-full" aria-hidden="true" />
      <h2 id="pending-title" className="text-display mt-6 text-2xl font-bold tracking-[0.14em] sm:text-3xl">Integração em desenvolvimento</h2>
      <p id="pending-desc" className="mt-4 text-[15px] leading-relaxed text-steel">{message}</p>
      <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-steel">
        Nenhuma encomenda foi enviada. Seu carrinho continua salvo nesta sessão ({formatBRL(draft.total)}).
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Voltar à revisão</Button>
        <Button variant="outline" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copy}>
          {copied ? 'Resumo copiado' : 'Copiar resumo'}
        </Button>
        <Button variant="blue" icon={<X className="h-4 w-4" />} onClick={onClose}>Fechar</Button>
      </div>
    </motion.div>
  );
}
