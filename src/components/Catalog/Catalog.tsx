import { motion } from 'motion/react';
import { Handshake, ShoppingBag } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { formatBRL } from '../../lib/pricing';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { useOrderUI } from '../../hooks/useOrderUI';
import type { Product } from '../../types/Product';
import { AddToCartButton } from '../ui/AddToCartButton';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { PRODUCT_ICONS, savingsPercent } from './productVisuals';

const rowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const } }),
};

function useAddWithToast() {
  const { add } = useCart();
  const { notify } = useToast();
  return (product: Product) => {
    add(product.id, 1);
    notify({ title: `${product.name} adicionado`, description: 'Item incluído no carrinho de encomenda.' });
  };
}

export function Catalog() {
  const addWithToast = useAddWithToast();
  const { quantityOf, units } = useCart();
  const { openOrder } = useOrderUI();

  return (
    <section id="catalogo" aria-labelledby="catalogo-title" className="relative scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(0,87,184,0.16),transparent_45%),radial-gradient(ellipse_at_95%_100%,rgba(213,43,30,0.12),transparent_45%)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="catalogo-title"
          eyebrow="Tabela TDR"
          title="Catálogo Oficial"
          subtitle="Consulte os valores dos itens virtuais disponíveis para encomenda no GTA Roleplay."
        />

        <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-steel">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-steel" aria-hidden="true" /> Sem parceria
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-ru-blue/40 bg-ru-blue/15 px-3 py-1.5 text-white">
            <Handshake className="h-3.5 w-3.5 text-ru-blue-light" aria-hidden="true" /> Com parceria — valores especiais
          </span>
          <span className="w-full text-center text-[11px] text-steel/70 sm:w-auto">Valores fictícios dentro do GTA RP.</span>
        </Reveal>

        {/* DESKTOP / TABLET — tabela */}
        <Reveal delay={0.15} className="panel mt-10 hidden overflow-hidden rounded-2xl md:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Catálogo oficial de preços da Tropa da Rússia, sem parceria e com parceria</caption>
            <thead>
              <tr className="relative border-b border-white/10 bg-gradient-to-r from-navy via-[#0d1b33] to-navy">
                <th scope="col" className="text-display px-6 py-5 text-xs font-semibold tracking-[0.3em] text-steel">Produto</th>
                <th scope="col" className="text-display px-6 py-5 text-right text-xs font-semibold tracking-[0.3em] text-steel">Sem parceria</th>
                <th scope="col" className="text-display px-6 py-5 text-right text-xs font-semibold tracking-[0.3em] text-ru-blue-light">
                  <span className="inline-flex items-center gap-2"><Handshake className="h-4 w-4" aria-hidden="true" />Com parceria</span>
                </th>
                <th scope="col" className="px-6 py-5"><span className="sr-only">Adicionar ao carrinho</span></th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
              {PRODUCTS.map((p, i) => {
                const Icon = PRODUCT_ICONS[p.id];
                const inCart = quantityOf(p.id);
                return (
                  <motion.tr
                    key={p.id}
                    custom={i}
                    variants={rowVariants}
                    className="group relative border-b border-white/[0.06] transition-colors duration-300 last:border-0 hover:bg-white/[0.035]"
                  >
                    <th scope="row" className="relative px-6 py-4 font-normal">
                      <span className="absolute inset-y-2 left-0 w-[3px] origin-center scale-y-0 rounded-r bg-ru-red transition-transform duration-300 group-hover:scale-y-100" aria-hidden="true" />
                      <span className="flex items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-white/10 to-transparent transition-all duration-300 group-hover:border-ru-red/50 group-hover:shadow-[0_0_18px_-4px_rgba(213,43,30,0.8)]">
                          <Icon className="h-[18px] w-[18px] text-white/90" aria-hidden="true" />
                        </span>
                        <span className="text-display text-[17px] font-medium tracking-[0.08em] text-white">{p.name}</span>
                        {inCart > 0 && (
                          <span className="rounded-full bg-ru-red/15 px-2 py-0.5 text-[11px] font-semibold text-ru-red-light">{inCart} no carrinho</span>
                        )}
                      </span>
                    </th>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums text-steel">{formatBRL(p.price.normal)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-md bg-ru-red/10 px-1.5 py-0.5 text-[11px] font-semibold text-ru-red-light">-{savingsPercent(p.price.normal, p.price.partner)}%</span>
                        <span className="rounded-lg border border-ru-blue/40 bg-ru-blue/15 px-3 py-1.5 text-[17px] font-bold tabular-nums text-white">
                          {formatBRL(p.price.partner)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AddToCartButton onAdd={() => addWithToast(p)} ariaLabel={`Adicionar ${p.name} ao carrinho`} />
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </Reveal>

        {/* MOBILE — cards */}
        <motion.ul
          className="mt-8 grid grid-cols-1 gap-3 md:hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Catálogo oficial"
        >
          {PRODUCTS.map((p, i) => {
            const Icon = PRODUCT_ICONS[p.id];
            const inCart = quantityOf(p.id);
            return (
              <motion.li key={p.id} custom={i} variants={rowVariants} className="panel relative overflow-hidden rounded-xl p-4">
                <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-ru-blue to-ru-red" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-display truncate text-base font-medium tracking-[0.08em]">{p.name}</h3>
                    {inCart > 0 && <p className="text-[11px] font-semibold text-ru-red-light">{inCart} no carrinho</p>}
                  </div>
                  <AddToCartButton compact onAdd={() => addWithToast(p)} ariaLabel={`Adicionar ${p.name} ao carrinho`} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-steel">Sem parceria</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-steel">{formatBRL(p.price.normal)}</dd>
                  </div>
                  <div className="rounded-lg border border-ru-blue/40 bg-ru-blue/15 px-3 py-2">
                    <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-ru-blue-light">
                      <Handshake className="h-3 w-3" aria-hidden="true" /> Parceria
                    </dt>
                    <dd className="mt-0.5 font-bold tabular-nums text-white">{formatBRL(p.price.partner)}</dd>
                  </div>
                </dl>
              </motion.li>
            );
          })}
        </motion.ul>

        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <Button variant="red" size="lg" icon={<ShoppingBag className="h-5 w-5" />} onClick={() => openOrder(units > 0 ? 'carrinho' : 'produtos')}>
            {units > 0 ? `Ver carrinho (${units})` : 'Fazer Encomenda'}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
