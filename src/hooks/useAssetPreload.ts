import { useEffect, useState } from 'react';

const MIN_VISIBLE_MS = 650; // tempo mínimo para a animação do loading não "piscar"
const MAX_WAIT_MS = 3500; // teto: o site nunca fica preso no loading

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    img.decode?.().then(() => resolve(), () => resolve());
  });
}

function loadVideo(src: string) {
  return new Promise<void>((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.oncanplay = v.onerror = () => resolve();
    v.src = src;
    v.load();
  });
}

/** Aguarda os recursos essenciais reais (logo, poster, vídeo do hero), com teto de segurança. */
export function useAssetPreload(images: string[], videos: string[] = []) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tasks = [...images.map(loadImage), ...videos.map(loadVideo)];
    let done = 0;
    tasks.forEach((t) => t.then(() => !cancelled && setProgress(Math.round((++done / tasks.length) * 100))));
    const started = performance.now();
    const all = Promise.all(tasks);
    const cap = new Promise<void>((r) => setTimeout(r, MAX_WAIT_MS));
    Promise.race([all, cap]).then(() => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      setTimeout(() => !cancelled && setReady(true), wait);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, progress };
}
