import { ClipboardCheck, Handshake, ShoppingBag, ShoppingCart, UserRound } from 'lucide-react';
import { media } from '../../assets';
import { useOrderUI } from '../../hooks/useOrderUI';
import { Button } from '../ui/Button';
import { CornerFrame } from '../ui/CornerFrame';
import { Reveal } from '../ui/Reveal';

const STEPS = [
  { icon: ShoppingBag, label: 'Escolha os produtos' },
  { icon: ShoppingCart, label: 'Revise o carrinho' },
  { icon: Handshake, label: 'Defina a modalidade' },
  { icon: UserRound, label: 'Identifique o personagem' },
  { icon: ClipboardCheck, label: 'Confirme a encomenda' },
];

export function OrderCTA() {
  const { openOrder } = useOrderUI();
  return (
    <section id="encomenda" aria-labelledby="encomenda-title" className="relative scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10">
        <img src={media.images.bannerDivulgacaoWide} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-right opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/90 to-graphite/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent md:hidden" />
        <CornerFrame />
        <div className="relative grid gap-10 px-6 py-12 sm:px-12 sm:py-16 md:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="text-display text-xs tracking-[0.35em] text-ru-red-light">Encomendas TDR</span>
            <h2 id="encomenda-title" className="text-display mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl">
              Monte sua <span className="text-russia">encomenda</span>
            </h2>
            <p className="mt-4 max-w-md text-steel">Selecione os itens, escolha a modalidade de preço e envie os dados do seu personagem em poucos passos.</p>
            <Button variant="red" size="lg" className="mt-8" icon={<ShoppingBag className="h-5 w-5" />} onClick={() => openOrder('produtos')}>
              Fazer Encomenda
            </Button>
          </div>
          <ol className="flex flex-col justify-center gap-2.5">
            {STEPS.map((s, i) => (
              <li key={s.label} className="glass flex items-center gap-4 rounded-xl px-4 py-3">
                <span className="text-display w-6 text-sm font-bold text-ru-blue-light">{String(i + 1).padStart(2, '0')}</span>
                <s.icon className="h-4 w-4 text-white/80" aria-hidden="true" />
                <span className="text-sm text-white/90">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
