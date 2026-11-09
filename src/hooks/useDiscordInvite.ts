import { useCallback } from 'react';
import { config } from '../config/env';
import { useToast } from './useToast';

/** Abre o convite configurado em VITE_DISCORD_INVITE_URL, ou avisa que está indisponível. */
export function useDiscordInvite() {
  const { notify } = useToast();
  const url = config.discordInviteUrl;
  const open = useCallback(() => {
    if (!url) {
      notify({
        tone: 'warning',
        title: 'Convite do Discord indisponível',
        description: 'O link oficial ainda não foi configurado. Tente novamente em breve.',
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [url, notify]);
  return { available: Boolean(url), url, open };
}
