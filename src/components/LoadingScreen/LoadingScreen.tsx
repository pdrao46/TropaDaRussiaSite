import { motion } from 'motion/react';
import { media } from '../../assets';

/** Tela de carregamento: logo oficial + linha tricolor animada. Some ao concluir o preload real. */
export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <motion.div
      key="loading"
      className="noise fixed inset-0 z-[100] flex flex-col items-center justify-center bg-graphite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      role="status"
      aria-live="polite"
      aria-label="Carregando a central da Tropa da Rússia"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,87,184,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(213,43,30,0.14),transparent_45%)]" />
      <motion.img
        src={media.logos.principal}
        alt="Tropa da Rússia"
        className="relative w-[min(56vw,260px)] drop-shadow-[0_20px_60px_rgba(213,43,30,0.35)]"
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.6 } }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="relative mt-10 h-[3px] w-[min(60vw,240px)] overflow-hidden rounded-full bg-white/10">
        <div className="tricolor animate-tricolor-load absolute inset-0" />
      </div>
      <p className="text-display mt-4 text-[11px] tracking-[0.45em] text-steel">
        Carregando <span className="tabular-nums text-white/80">{progress}%</span>
      </p>
    </motion.div>
  );
}
