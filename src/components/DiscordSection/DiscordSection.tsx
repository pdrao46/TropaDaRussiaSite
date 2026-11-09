import { ExternalLink } from 'lucide-react';
import { media } from '../../assets';
import { useDiscordInvite } from '../../hooks/useDiscordInvite';
import { Button } from '../ui/Button';
import { CornerFrame } from '../ui/CornerFrame';
import { DiscordIcon } from '../ui/DiscordIcon';
import { MediaLoop } from '../ui/MediaLoop';
import { Reveal } from '../ui/Reveal';

export function DiscordSection() {
  const discord = useDiscordInvite();
  return (
    <section id="discord" aria-labelledby="discord-title" className="relative scroll-mt-20 px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <Reveal className="relative order-2 md:order-1">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,87,184,0.7)]">
            <div className="relative aspect-video">
              <MediaLoop
                src={media.videos.heroLoop}
                poster={media.images.bannerDiscord}
                gifFallback={media.gifs.bannerDiscord}
                playWhenVisible
                alt="Banner animado do Discord da Tropa da Rússia"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <CornerFrame size="h-4 w-4" />
            </div>
          </div>
          <img
            src={media.images.iconeServidorDiscord}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="animate-float-slow absolute -bottom-8 -right-4 w-24 rounded-full border-4 border-graphite shadow-2xl sm:w-28"
          />
        </Reveal>
        <Reveal delay={0.1} className="order-1 md:order-2">
          <span className="text-display flex items-center gap-2 text-xs tracking-[0.35em] text-ru-blue-light">
            <DiscordIcon className="h-4 w-4" /> Comunidade oficial
          </span>
          <h2 id="discord-title" className="text-display mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl">
            Entre no <span className="text-ru-blue-light">Discord</span> da tropa
          </h2>
          <span className="tricolor mt-5 block h-[3px] w-24 rounded-full" aria-hidden="true" />
          <p className="mt-5 max-w-md text-steel">Acompanhe comunicados, fale com a equipe responsável e acompanhe suas encomendas diretamente na comunidade oficial da TDR.</p>
          <Button
            variant="blue"
            size="lg"
            className="mt-8"
            icon={<DiscordIcon className="h-5 w-5" />}
            iconRight={discord.available ? <ExternalLink className="h-4 w-4 opacity-70" /> : undefined}
            onClick={discord.open}
            aria-disabled={!discord.available}
          >
            Entrar no Discord
          </Button>
          {!discord.available && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-steel">
              <span className="h-1.5 w-1.5 rounded-full bg-ru-red" aria-hidden="true" /> Link indisponível no momento — convite em configuração.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
