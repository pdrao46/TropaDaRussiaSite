import { media } from '../../assets';

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-navy/40">
      <span className="tricolor absolute inset-x-0 top-0 block h-[2px] opacity-80" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
        <img src={media.logos.horizontal} alt="Tropa da Rússia" loading="lazy" className="h-14 w-auto sm:h-16" />
        <div className="max-w-sm">
          <p className="text-display text-sm font-semibold tracking-[0.3em]">Tropa da Rússia</p>
          <p className="mt-2 text-sm text-steel">Organização, respeito e compromisso dentro do GTA Roleplay.</p>
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-4 py-5 text-center text-[11px] text-steel/70">
        © {new Date().getFullYear()} TDR • GTA Roleplay — Facção fictícia. Todos os valores são fictícios e válidos somente dentro do jogo.
      </div>
    </footer>
  );
}
