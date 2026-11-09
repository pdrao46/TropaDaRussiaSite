import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, Clock3, Hammer, Loader2, RotateCw, ServerOff, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { media } from '../../assets';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStatus } from '../../types/auth';
import { Button } from '../ui/Button';
import { DiscordIcon } from '../ui/DiscordIcon';

/** Interface "Conectar conta Discord" — abre a partir do header. */
export function DiscordLoginModal() {
  const { isLoginOpen, closeLogin } = useAuth();
  return <AnimatePresence>{isLoginOpen && <LoginDialog key="discord-login" onClose={closeLogin} />}</AnimatePresence>;
}

type NoticeTone = 'info' | 'warning' | 'danger';

function Notice({ tone, icon, title, children }: { tone: NoticeTone; icon: ReactNode; title: string; children: ReactNode }) {
  const styles: Record<NoticeTone, string> = {
    info: 'border-ru-blue/40 bg-ru-blue/10',
    warning: 'border-white/20 bg-white/[0.05]',
    danger: 'border-ru-red/50 bg-ru-red/10',
  };
  const iconColor: Record<NoticeTone, string> = { info: 'text-ru-blue-light', warning: 'text-white', danger: 'text-ru-red-light' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`mt-6 flex gap-3 rounded-2xl border p-4 text-left ${styles[tone]}`}
    >
      <span className={`mt-0.5 shrink-0 ${iconColor[tone]}`}>{icon}</span>
      <div>
        <p className="text-display text-[13px] font-semibold tracking-[0.12em]">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-steel">{children}</p>
      </div>
    </motion.div>
  );
}

function StatusNotice({ status, message, offline }: { status: AuthStatus; message?: string; offline: boolean }) {
  switch (status) {
    case 'unavailable':
      return offline ? (
        <Notice tone="warning" icon={<ServerOff className="h-5 w-5" />} title="Login indisponível">{message}</Notice>
      ) : (
        <Notice tone="info" icon={<Hammer className="h-5 w-5" />} title="Autenticação em desenvolvimento">{message}</Notice>
      );
    case 'expired':
      return <Notice tone="warning" icon={<Clock3 className="h-5 w-5" />} title="Sessão expirada">{message}</Notice>;
    case 'error':
      return <Notice tone="danger" icon={<CircleAlert className="h-5 w-5" />} title="Erro na autenticação">{message}</Notice>;
    default:
      return null;
  }
}

function LoginDialog({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const notConfigured = auth.status === 'unavailable' && auth.unavailableReason === 'not_configured';
  const offline = auth.status === 'unavailable' && auth.unavailableReason === 'offline';
  const busy = auth.status === 'connecting' || auth.status === 'checking';

  // trava a rolagem, foco inicial e ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // conectou (ex.: revalidação) → fecha a interface
  useEffect(() => {
    if (auth.status === 'authenticated') onClose();
  }, [auth.status, onClose]);

  const primary = (() => {
    if (busy) return { label: auth.status === 'checking' ? 'Verificando…' : 'Conectando…', icon: <Loader2 className="h-5 w-5 animate-spin" />, action: undefined };
    if (offline) return { label: 'Tentar novamente', icon: <RotateCw className="h-5 w-5" />, action: auth.refresh };
    if (auth.status === 'expired') return { label: 'Conectar novamente', icon: <DiscordIcon className="h-5 w-5" />, action: auth.login };
    if (auth.status === 'error') return { label: 'Tentar novamente', icon: <RotateCw className="h-5 w-5" />, action: auth.login };
    return { label: 'Continuar com Discord', icon: <DiscordIcon className="h-5 w-5" />, action: notConfigured ? undefined : auth.login };
  })();

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-graphite/80 backdrop-blur-md sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discord-login-title"
        aria-describedby="discord-login-desc"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="noise relative w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 bg-graphite px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-8 text-center shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] outline-none sm:rounded-3xl sm:px-9 sm:pb-9 sm:pt-10"
      >
        <span className="tricolor absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,87,184,0.28),transparent_60%),radial-gradient(ellipse_at_100%_100%,rgba(213,43,30,0.12),transparent_50%)]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-steel transition-colors hover:border-white/30 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          {/* Emblema: símbolo TDR ⟷ Discord */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex w-max items-center gap-3"
            aria-hidden="true"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <img src={media.logos.simboloSmall} alt="" className="h-11 w-11" />
            </span>
            <span className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ru-blue-light"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </span>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a6fd4] to-ru-blue shadow-[0_10px_30px_-10px_rgba(0,87,184,0.9)]">
              <DiscordIcon className="h-8 w-8 text-white" />
            </span>
          </motion.div>

          <p className="text-display mt-7 text-[11px] tracking-[0.35em] text-steel">Tropa da Rússia</p>
          <h2 id="discord-login-title" className="text-display mt-2 text-2xl font-bold tracking-[0.1em] sm:text-[28px]">
            Conectar conta Discord
          </h2>
          <span className="tricolor-soft mx-auto mt-4 block h-px w-32" aria-hidden="true" />
          <p id="discord-login-desc" className="mt-4 text-[15px] leading-relaxed text-steel">
            Conecte sua conta Discord para identificar seu perfil e facilitar o acompanhamento das suas encomendas no GTA Roleplay.
          </p>

          <StatusNotice status={auth.status} message={auth.message} offline={offline} />

          <Button
            variant="blue"
            size="lg"
            className="mt-6 w-full"
            icon={primary.icon}
            onClick={primary.action}
            disabled={!primary.action}
            aria-describedby={notConfigured ? 'discord-login-soon' : undefined}
          >
            {primary.label}
          </Button>
          {notConfigured && (
            <p id="discord-login-soon" className="mt-2.5 text-xs text-steel/80">
              Disponível assim que o sistema de login for ativado.
            </p>
          )}

          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-steel">
            <ShieldCheck className="h-4 w-4 shrink-0 text-ru-blue-light" aria-hidden="true" />
            A autenticação será realizada pelo sistema oficial do Discord.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
