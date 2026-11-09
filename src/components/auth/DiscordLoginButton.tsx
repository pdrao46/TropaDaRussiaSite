import { Loader2 } from 'lucide-react';
import { DiscordIcon } from '../ui/DiscordIcon';

type Tone = 'default' | 'loading' | 'attention';

interface Props {
  onClick: () => void;
  /** `loading`: verificando/conectando · `attention`: sessão expirada ou erro. */
  tone?: Tone;
  /** Texto curto exibido em telas médias. */
  shortLabel?: string;
  /** Texto completo (telas grandes e leitores de tela). */
  label?: string;
  /** Versão compacta da faixa do header em celulares (texto completo, altura menor). */
  compact?: boolean;
}

/** Botão "Entrar com Discord" do header — mesmo padrão visual dos botões Discord/Encomenda. */
export function DiscordLoginButton({ onClick, tone = 'default', label = 'Entrar com Discord', shortLabel = 'Entrar', compact = false }: Props) {
  const loading = tone === 'loading';
  const sizeCls = compact ? 'h-8 px-3 text-[11px]' : 'h-10 w-10 text-[13px] sm:h-11 sm:w-auto sm:px-4';
  const iconCls = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-busy={loading || undefined}
      aria-haspopup="dialog"
      title={label}
      className={`sheen group relative inline-flex ${sizeCls} items-center justify-center gap-2 rounded-lg border border-ru-blue-light/45 bg-white/[0.04] font-semibold uppercase tracking-[0.1em] text-white transition-[background-color,border-color,box-shadow] duration-300 hover:border-ru-blue-light hover:bg-ru-blue/20 hover:shadow-[0_0_24px_-6px_rgba(0,87,184,0.9)] `}
    >
      {loading ? (
        <Loader2 className={`${iconCls} animate-spin text-ru-blue-light`} aria-hidden="true" />
      ) : (
        <DiscordIcon className={`${iconCls} transition-transform duration-300 group-hover:scale-110`} />
      )}
      {compact ? (
        <span className="text-display">{label}</span>
      ) : (
        <>
          <span className="text-display hidden sm:inline lg:hidden">{shortLabel}</span>
          <span className="text-display hidden lg:inline">{label}</span>
          <span className="sr-only sm:hidden">{label}</span>
        </>
      )}
      {tone === 'attention' && (
        <span className="absolute -right-1 -top-1 flex h-3 w-3" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ru-red opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-graphite bg-ru-red" />
        </span>
      )}
    </button>
  );
}
