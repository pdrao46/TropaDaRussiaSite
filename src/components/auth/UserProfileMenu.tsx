import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Loader2, LogOut, Package, UserRound } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AuthUser } from '../../types/auth';
import { DiscordIcon } from '../ui/DiscordIcon';

interface Props {
  /** Usuário vindo EXCLUSIVAMENTE da sessão autenticada (`GET /api/auth/me`). */
  user: AuthUser;
  onProfile: () => void;
  onOrders: () => void;
  onLogout: () => Promise<void>;
  /** Versão compacta (faixa do header em celulares). */
  compact?: boolean;
}

function Avatar({ user, size }: { user: AuthUser; size: 'xs' | 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false);
  const cls = size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'sm' ? 'h-7 w-7 text-xs sm:h-8 sm:w-8' : 'h-11 w-11 text-base';
  return failed ? (
    <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-ru-blue font-bold uppercase text-white`} aria-hidden="true">
      {user.displayName.charAt(0)}
    </span>
  ) : (
    <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${cls} shrink-0 rounded-full object-cover`} />
  );
}

/** Perfil do usuário conectado no header + menu (Meu Perfil, Minhas Encomendas, Sair). */
export function UserProfileMenu({ user, onProfile, onOrders, onLogout, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMenuKey = (e: ReactKeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const itemCls =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/90 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.08]';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={`Conectado como ${user.displayName}`}
        className={`sheen group inline-flex ${compact ? 'h-8 pl-1 pr-2.5' : 'h-10 pl-1.5 pr-1.5 sm:h-11 sm:pr-3'} items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] text-white transition-[background-color,border-color,box-shadow] duration-300 hover:border-ru-blue-light/70 hover:bg-white/[0.08] hover:shadow-[0_0_24px_-8px_rgba(0,87,184,0.9)]`}
      >
        <span className="relative">
          <Avatar user={user} size={compact ? 'xs' : 'sm'} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-graphite bg-ru-blue-light" aria-hidden="true" />
        </span>
        <span className={`max-w-[9rem] truncate font-semibold ${compact ? 'text-xs' : 'hidden text-sm sm:inline'}`}>{user.displayName}</span>
        <ChevronDown className={`h-4 w-4 text-steel transition-transform duration-300 ${compact ? '' : 'hidden sm:block'} ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span className="sr-only">Abrir menu da conta {user.displayName} (conta Discord conectada)</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label="Menu da conta"
            onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-[55] mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-graphite/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(0,87,184,0.18),transparent_55%)]" />
            <div className="relative flex items-center gap-3 p-4">
              <Avatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.displayName}</p>
                <p className="truncate text-xs text-steel">@{user.username}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-ru-blue/40 bg-ru-blue/15 px-2 py-0.5 text-[11px] font-medium text-white">
                  <DiscordIcon className="h-3 w-3 text-ru-blue-light" /> Conta conectada
                </p>
              </div>
            </div>
            <span className="tricolor relative block h-[2px] w-full opacity-80" aria-hidden="true" />
            <div className="relative p-2">
              <button type="button" role="menuitem" className={itemCls} onClick={run(onProfile)}>
                <UserRound className="h-4 w-4 text-ru-blue-light" aria-hidden="true" /> Meu Perfil
              </button>
              <button type="button" role="menuitem" className={itemCls} onClick={run(onOrders)}>
                <Package className="h-4 w-4 text-ru-blue-light" aria-hidden="true" /> Minhas Encomendas
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button
                type="button"
                role="menuitem"
                disabled={leaving}
                className={`${itemCls} text-ru-red-light hover:bg-ru-red/10 hover:text-ru-red-light`}
                onClick={async () => {
                  setLeaving(true);
                  await onLogout();
                  setLeaving(false);
                  setOpen(false);
                }}
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                Sair da Conta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
