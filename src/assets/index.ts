/** Mapa central dos arquivos visuais oficiais (logos, imagens, GIFs e vídeos). */
import logoPrincipal from './logos/logo-principal.webp';
import logoPrincipalBranca from './logos/logo-principal-branca.webp';
import simbolo from './logos/simbolo.webp';
import simboloSmall from './logos/simbolo-128.webp';
import logoHorizontal from './logos/logo-horizontal.webp';
import iconeServidorDiscord from './images/icone-servidor-discord.webp';
import bannerDiscord from './images/banner-discord.webp';
import bannerDivulgacaoQuadrado from './images/banner-divulgacao-quadrado.webp';
import bannerDivulgacaoWide from './images/banner-divulgacao-wide.webp';
import heroPoster from './images/hero-poster.webp';
import aberturaPoster from './images/abertura-poster.webp';
import heroLoop from './videos/hero-loop.mp4';
import abertura1080 from './videos/abertura-1080.mp4';
import abertura720 from './videos/abertura-720.mp4';
import gifAnimacaoLogo from './gifs/animacao-logo.gif';
import gifBannerDiscord from './gifs/banner-animado-discord.gif';

export const media = {
  logos: { principal: logoPrincipal, principalBranca: logoPrincipalBranca, simbolo, simboloSmall, horizontal: logoHorizontal },
  images: { iconeServidorDiscord, bannerDiscord, bannerDivulgacaoQuadrado, bannerDivulgacaoWide, heroPoster, aberturaPoster },
  videos: { heroLoop, abertura1080, abertura720 },
  /** GIFs usados como fallback animado quando o vídeo correspondente falha. */
  gifs: { animacaoLogo: gifAnimacaoLogo, bannerDiscord: gifBannerDiscord },
} as const;
