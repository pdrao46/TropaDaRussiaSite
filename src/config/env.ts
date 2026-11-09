/**
 * Configuração pública do frontend.
 * Variáveis VITE_* são embutidas no bundle e ficam visíveis no navegador:
 * use apenas valores públicos (NUNCA tokens de bot ou segredos).
 */
const DISCORD_INVITE_PATTERN = /^https:\/\/(discord\.gg|(www\.)?discord\.com\/invite)\/[A-Za-z0-9-]+\/?$/;

function readDiscordInvite(): string | null {
  const raw = (import.meta.env.VITE_DISCORD_INVITE_URL ?? '').trim();
  return DISCORD_INVITE_PATTERN.test(raw) ? raw : null;
}

function readApiBase(): string {
  // Vazio = mesma origem (recomendado na Vercel: /api/... no mesmo domínio, cookies first-party).
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
}

export const config = {
  /** URL pública do convite do Discord, ou `null` se não configurada/ inválida. */
  discordInviteUrl: readDiscordInvite(),
  /** Reservado para o Arena AI. Não é usado nesta etapa. */
  ordersApiUrl: (import.meta.env.VITE_ORDERS_API_URL ?? '').trim() || null,
  /**
   * Login com Discord. Enquanto `false`, NENHUMA chamada de autenticação é feita
   * e a interface informa que o login está em desenvolvimento.
   * O Arena ativa com VITE_AUTH_ENABLED=true quando o backend estiver no ar.
   */
  authEnabled: (import.meta.env.VITE_AUTH_ENABLED ?? '').trim().toLowerCase() === 'true',
  /** Base da API (sem barra final). Vazio = mesma origem. */
  apiBaseUrl: readApiBase(),
} as const;
