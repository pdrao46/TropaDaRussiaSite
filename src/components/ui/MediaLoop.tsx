import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface MediaLoopProps {
  src: string;
  poster: string;
  /** GIF animado usado se o vídeo falhar. */
  gifFallback?: string;
  className?: string;
  /** Reproduz apenas quando visível (economia em celular). */
  playWhenVisible?: boolean;
  alt?: string;
  onReady?: () => void;
}

/**
 * Vídeo em loop, mudo e inline, com poster e fallback.
 * Ordem de degradação: vídeo → GIF → poster estático. Nunca trava a página.
 */
export function MediaLoop({ src, poster, gifFallback, className = '', playWhenVisible = false, alt = '', onReady }: MediaLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    const tryPlay = () => video.play().catch(() => undefined); // autoplay bloqueado: fica o poster
    if (!playWhenVisible) {
      tryPlay();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? tryPlay() : video.pause()),
      { threshold: 0.15 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [playWhenVisible, reduced, src]);

  if (reduced || failed) {
    const still = failed && gifFallback && !reduced ? gifFallback : poster;
    return <img src={still} alt={alt} className={className} loading="lazy" decoding="async" onLoad={onReady} />;
  }

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={!playWhenVisible}
      preload={playWhenVisible ? 'metadata' : 'auto'}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      onLoadedData={onReady}
      onError={() => {
        setFailed(true);
        onReady?.();
      }}
    />
  );
}
