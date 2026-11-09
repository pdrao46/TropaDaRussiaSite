import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Handshake, Medal, ShieldCheck } from 'lucide-react';
import { media } from '../../assets';
import { useIsDesktop, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { CornerFrame } from '../ui/CornerFrame';
import { MediaLoop } from '../ui/MediaLoop';
import { Reveal } from '../ui/Reveal';

const PILLARS = [
  { icon: Medal, title: 'Respeito', text: 'Postura firme dentro e fora das operações.', accent: 'text-white' },
  { icon: ShieldCheck, title: 'Organização', text: 'Cada encomenda tratada com método e controle.', accent: 'text-ru-blue-light' },
  { icon: Handshake, title: 'Lealdade', text: 'Compromisso com a tropa e com os parceiros.', accent: 'text-ru-red-light' },
];

/** Interlúdio cinematográfico com a animação oficial do logotipo. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.45], [reduced ? 1 : 0.9, 1]);

  return (
    <section ref={ref} aria-label="Apresentação da Tropa da Rússia" className="relative px-4 pt-10 sm:px-6 lg:px-8">
      <motion.div style={{ scale }} className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_-40px_rgba(0,87,184,0.6)] sm:rounded-3xl">
        <div className="relative aspect-video w-full bg-black">
          <MediaLoop
            src={desktop ? media.videos.abertura1080 : media.videos.abertura720}
            poster={media.images.aberturaPoster}
            gifFallback={media.gifs.animacaoLogo}
            playWhenVisible
            alt="Animação oficial do logotipo da Tropa da Rússia"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/30" />
          <div className="vignette pointer-events-none absolute inset-0 opacity-70" />
          <CornerFrame />
          <span className="text-display absolute left-6 top-5 hidden text-[10px] tracking-[0.4em] text-white/70 sm:block">TDR • GTA Roleplay</span>
          <span className="text-display absolute right-6 top-5 hidden items-center gap-2 text-[10px] tracking-[0.4em] text-white/70 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ru-red" aria-hidden="true" /> Oficial
          </span>
        </div>
      </motion.div>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.12} className="panel group flex items-start gap-4 rounded-2xl p-5 transition-colors hover:border-white/25">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-transform duration-500 group-hover:scale-110">
              <p.icon className={`h-5 w-5 ${p.accent}`} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-display text-lg font-semibold tracking-[0.18em]">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-steel">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
