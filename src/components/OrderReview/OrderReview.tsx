import { AtSign, Handshake, Hash, Phone, Shield, UserRound } from 'lucide-react';
import type { OrderDraft } from '../../types/Order';
import { formatBRL } from '../../lib/pricing';
import { media } from '../../assets';
import { PRODUCT_ICONS } from '../Catalog/productVisuals';
import { StepHeader } from '../OrderExperience/StepHeader';

/** Tela "REVISAR ENCOMENDA": exibe todos os dados antes da confirmação. */
export function OrderReview({ draft }: { draft: OrderDraft }) {
  const { customer } = draft;
  const partner = draft.partnership === 'com_parceria';
  const rows = [
    { icon: UserRound, label: 'Nome RP', value: customer.characterName },
    { icon: Hash, label: 'ID do jogo', value: customer.characterId },
    { icon: Shield, label: 'Facção', value: customer.factionName },
    { icon: Phone, label: 'Telefone RP', value: customer.phoneRp },
    { icon: AtSign, label: 'Discord', value: customer.discordUser + (customer.discordId ? ` (ID ${customer.discordId})` : '') },
  ];

  return (
    <div>
      <StepHeader step={5} title="Revisar encomenda" description="Confira todos os dados antes de confirmar." />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-navy via-graphite to-graphite">
        <img src={media.logos.simbolo} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -top-6 w-56 opacity-[0.06] sm:w-72" />
        <span className="tricolor block h-[3px] w-full" aria-hidden="true" />

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.2fr]">
          <section aria-labelledby="rev-dados">
            <h3 id="rev-dados" className="text-display text-xs tracking-[0.3em] text-steel">Dados do personagem</h3>
            <dl className="mt-3 divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] bg-black/20">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                  <r.icon className="h-4 w-4 shrink-0 text-steel" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-xs text-steel">{r.label}</dt>
                  <dd className="min-w-0 break-words text-sm font-medium text-white">{r.value}</dd>
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-3">
                <Handshake className="h-4 w-4 shrink-0 text-steel" aria-hidden="true" />
                <dt className="w-24 shrink-0 text-xs text-steel">Tipo de preço</dt>
                <dd className="text-sm font-semibold">
                  <span className={partner ? 'text-ru-blue-light' : 'text-white'}>{partner ? 'Com parceria' : 'Sem parceria'}</span>
                  {partner && draft.partnerFaction && <span className="block text-xs font-normal text-steel">Parceira: {draft.partnerFaction}</span>}
                </dd>
              </div>
            </dl>
            {customer.notes && (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
                <p className="text-xs text-steel">Observações</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/90">{customer.notes}</p>
              </div>
            )}
          </section>

          <section aria-labelledby="rev-itens">
            <h3 id="rev-itens" className="text-display text-xs tracking-[0.3em] text-steel">Produtos</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.18em] text-steel">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Item</th>
                    <th scope="col" className="px-2 py-2.5 text-center font-medium">Qtd.</th>
                    <th scope="col" className="hidden px-2 py-2.5 text-right font-medium sm:table-cell">Unitário</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((item) => {
                    const Icon = PRODUCT_ICONS[item.productId];
                    return (
                      <tr key={item.productId} className="border-t border-white/[0.06]">
                        <th scope="row" className="px-4 py-3 text-left font-medium">
                          <span className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-steel" aria-hidden="true" />{item.name}</span>
                        </th>
                        <td className="px-2 py-3 text-center tabular-nums">{item.quantity}</td>
                        <td className="hidden px-2 py-3 text-right tabular-nums text-steel sm:table-cell">{formatBRL(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatBRL(item.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-end justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-4">
              <span className="text-display text-sm tracking-[0.3em] text-steel">Valor total</span>
              <span className="text-display text-3xl font-bold tabular-nums sm:text-4xl">{formatBRL(draft.total)}</span>
            </div>
            {partner && <p className="mt-2 text-[11px] text-ru-blue-light">Os valores de parceria estão sujeitos à validação da equipe responsável.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
