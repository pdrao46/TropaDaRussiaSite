import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import { media } from '../../assets';
import { useDiscordInvite } from '../../hooks/useDiscordInvite';
import { useOrderUI } from '../../hooks/useOrderUI';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { Button } from '../ui/Button';
import { DiscordIcon } from '../ui/DiscordIcon';
import { MediaLoop } from '../ui/MediaLoop';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Sequência: fundo → logo → título → subtítulo → botões → indicador de rolagem. */
const seq = (i: number) => ({ duration: 1, delay: 0.25 + i * 0.22, ease: EASE });

export function Hero({ start }: { start: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const discord = useDiscordInvite();
  const { openOrder } = useOrderUI();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-12%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const state = start ? 'show' : 'hide';

  return (
    <section ref={ref} id="topo" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* 1. Background em vídeo */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y: bgY }}
        initial={{ opacity: 0, scale: 1.12 }}
        animate={start ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 2.2, ease: EASE }}
      >
        <MediaLoop
          src={media.videos.heroLoop}
          poster={media.images.heroPoster}
          gifFallback={media.gifs.bannerDiscord}
          className="h-full w-full scale-[1.18] object-cover blur-[7px] brightness-[0.5] saturate-[1.15] sm:blur-[9px]"
        />
        {/* overlays: escurecimento, gradiente azul, brilho vermelho, vinheta */}
        <div className="absolute inset-0 bg-graphite/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(0,87,184,0.45),transparent_55%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_75%,rgba(213,43,30,0.32),transparent_55%)] mix-blend-screen" />
        <div className="vignette absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-graphite" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-graphite/80 to-transparent" />
      </motion.div>
      <div className="noise pointer-events-none absolute inset-0 -z-10" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-32 pt-28 text-center sm:px-8"
      >
        {/* 2. Logotipo oficial (símbolo) */}
        <motion.div
          initial="hide"
          animate={state}
          variants={{ hide: { opacity: 0, y: 24, scale: 0.9, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' } }}
          transition={seq(0)}
          className="relative mb-4 sm:mb-6"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-ru-red/25 blur-3xl" aria-hidden="true" />
          <img
            src={media.logos.simbolo}
            alt="Símbolo oficial da Tropa da Rússia: urso coroado"
            className="animate-float-slow h-auto w-[clamp(120px,22vw,200px)] drop-shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
            fetchPriority="high"
          />
        </motion.div>

        {/* 3. Título */}
        <h1 id="hero-title" className="flex flex-col items-center leading-none">
          <motion.span
            initial="hide"
            animate={state}
            variants={{ hide: { opacity: 0, letterSpacing: '0.6em' }, show: { opacity: 1, letterSpacing: '0.32em' } }}
            transition={seq(1)}
            className="text-display flex items-center gap-3 text-[clamp(1rem,3.4vw,1.9rem)] font-semibold text-white sm:gap-5"
          >
            <span className="tricolor h-[3px] w-8 rounded-full sm:w-16" aria-hidden="true" />
            Tropa da
            <span className="tricolor h-[3px] w-8 rounded-full sm:w-16" aria-hidden="true" />
          </motion.span>
          <motion.span
            initial="hide"
            animate={state}
            variants={{ hide: { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' }, show: { opacity: 1, y: 0, clipPath: 'inset(0 0 -20% 0)' } }}
            transition={{ ...seq(1.4), duration: 1.2 }}
            className="text-russia mt-2 block pr-[0.06em] text-[clamp(4.2rem,16vw,10rem)] leading-[0.95] tracking-[0.01em]"
          >
            Rússia
          </motion.span>
        </h1>

        {/* 4. Subtítulo */}
        <motion.div initial="hide" animate={state} variants={{ hide: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} transition={seq(2.6)}>
          <p className="text-display mt-5 text-[clamp(0.85rem,2.4vw,1.15rem)] font-medium tracking-[0.28em] text-white sm:tracking-[0.42em]">
            Respeito<span className="text-ru-red">.</span> Organização<span className="text-ru-blue-light">.</span> Lealdade<span className="text-ru-red">.</span>
          </p>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-steel sm:text-lg">
            A central oficial da TROPA DA RÚSSIA no GTA Roleplay. Acesse nossa comunidade ou realize sua encomenda de itens virtuais.
          </p>
        </motion.div>

        {/* 5. Botões */}
        <motion.div
          initial="hide"
          animate={state}
          variants={{ hide: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 + 3.4 * 0.22 } } }}
          className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
        >
          <motion.div variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}>
            <Button
              variant="blue"
              size="lg"
              className="w-full sm:w-auto"
              icon={<DiscordIcon className="h-5 w-5" />}
              onClick={discord.open}
              aria-disabled={!discord.available}
              title={discord.available ? undefined : 'Link do Discord indisponível no momento'}
            >
              Entrar no Discord
            </Button>
          </motion.div>
          <motion.div variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}>
            <Button variant="red" size="lg" className="w-full sm:w-auto" icon={<ShoppingBag className="h-5 w-5" />} onClick={() => openOrder('produtos')}>
              Fazer Encomenda
            </Button>
          </motion.div>
        </motion.div>
        {!discord.available && start && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-3 text-xs text-steel/80">
            Convite do Discord em configuração.
          </motion.p>
        )}
      </motion.div>

      {/* 6. Indicador de rolagem */}
      <motion.a
        href="#catalogo"
        aria-label="Rolar até o catálogo"
        initial={{ opacity: 0, y: -10 }}
        animate={start ? { opacity: 1, y: 0 } : undefined}
        transition={seq(5)}
        className="absolute bottom-5 left-1/2 hidden [@media(min-height:700px)]:flex -translate-x-1/2 flex-col items-center gap-2 text-steel transition-colors hover:text-white"
      >
        <span className="text-display text-[10px] tracking-[0.4em]">Catálogo</span>
        <span className="flex h-9 w-6 justify-center rounded-full border border-white/30 pt-1.5">
          <motion.span
            className="h-2 w-1 rounded-full bg-white"
            animate={reduced ? undefined : { y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
