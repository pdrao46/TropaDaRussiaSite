import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { media } from '../../assets';
import { useScrolled } from '../../hooks/useScrolled';
import { useDiscordInvite } from '../../hooks/useDiscordInvite';
import { useOrderUI } from '../../hooks/useOrderUI';
import { useCart } from '../../hooks/useCart';
import { DiscordIcon } from '../ui/DiscordIcon';
import { AuthStatus } from '../auth/AuthStatus';

export function Header() {
  const scrolled = useScrolled();
  const discord = useDiscordInvite();
  const { openOrder } = useOrderUI();
  const { units } = useCart();

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled ? 'border-b border-white/10 bg-graphite/75 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <a href="#topo" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="Tropa da Rússia — início">
          <img src={media.logos.simboloSmall} alt="" className="h-9 w-9 shrink-0 transition-transform duration-500 group-hover:scale-110 sm:h-11 sm:w-11" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-display whitespace-nowrap text-[13px] font-bold tracking-[0.08em] text-white min-[400px]:text-[15px] min-[400px]:tracking-[0.12em] sm:text-lg sm:tracking-[0.14em]">
              Tropa da <span className="text-ru-red">Rússia</span>
            </span>
            <span className="tricolor mt-1.5 hidden h-[2px] w-full rounded-full sm:block" aria-hidden="true" />
          </span>
        </a>

        <nav aria-label="Ações principais" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <AuthStatus />
          </div>
          <button
            type="button"
            onClick={discord.open}
            aria-disabled={!discord.available}
            title={discord.available ? 'Entrar no Discord oficial' : 'Link do Discord indisponível'}
            className="sheen group inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-ru-blue/90 px-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-ru-blue hover:shadow-[0_0_24px_-4px_rgba(0,87,184,0.9)] aria-disabled:bg-white/5 aria-disabled:text-steel sm:h-11 sm:px-4"
          >
            <DiscordIcon className="h-[18px] w-[18px]" />
            <span className="text-display hidden sm:inline">Discord</span>
            <span className="sr-only sm:hidden">Discord</span>
          </button>
          <button
            type="button"
            onClick={() => openOrder(units > 0 ? 'carrinho' : 'produtos')}
            className="sheen group relative inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-ru-red/90 px-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-ru-red hover:shadow-[0_0_24px_-4px_rgba(213,43,30,0.9)] sm:h-11 sm:px-4"
          >
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="text-display">Encomenda</span>
            {units > 0 && (
              <motion.span
                key={units}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-graphite bg-white px-1 text-[11px] font-bold text-ru-red"
                aria-label={`${units} itens no carrinho`}
              >
                {units}
              </motion.span>
            )}
          </button>
        </nav>
      </div>
      {/* Celulares: login Discord em uma faixa discreta abaixo da barra, sem apertar os botões existentes */}
      <div className="flex justify-end px-4 pb-2 sm:hidden">
        <AuthStatus compact />
      </div>
    </motion.header>
  );
}
