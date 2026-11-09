import { z } from 'zod';
import { config } from '../config/env';
import type { AuthErrorCode, AuthUser, DiscordUser, SessionResult } from '../types/auth';

/**
 * Serviço de autenticação Discord — PONTO DE INTEGRAÇÃO DO ARENA AI.
 *
 * Contrato sugerido (o Arena define a implementação definitiva):
 *   GET  /api/auth/discord  → redireciona ao OAuth2 do Discord (state + PKCE no backend)
 *   GET  /api/auth/me       → 200 { user: DiscordUser } | 401 { code: 'unauthenticated' | 'session_expired' }
 *   POST /api/auth/logout   → 204, invalida a sessão e apaga o cookie
 *
 * Regras de segurança:
 * - O frontend NUNCA recebe nem guarda access_token/refresh_token (nada em localStorage/sessionStorage).
 * - A sessão é um cookie HttpOnly + Secure + SameSite=Lax definido pelo backend.
 * - Todas as chamadas usam `credentials: 'include'`.
 * - Enquanto `config.authEnabled` for false, nenhuma requisição é feita.
 */

export const AUTH_ENDPOINTS = {
  login: '/api/auth/discord',
  me: '/api/auth/me',
  logout: '/api/auth/logout',
} as const;

export const AUTH_MESSAGES = {
  notConfigured: 'O login com Discord está em desenvolvimento e será liberado em breve. Por enquanto, preencha seus dados manualmente na encomenda.',
  offline: 'O serviço de login está indisponível no momento. Tente novamente em alguns minutos.',
  expired: 'Sua sessão expirou por segurança. Conecte sua conta Discord novamente para continuar.',
  generic: 'Não foi possível concluir a autenticação com o Discord. Tente novamente.',
} as const;

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  access_denied: 'A autorização foi cancelada no Discord. Para conectar sua conta, autorize o acesso quando solicitado.',
  invalid_state: 'A solicitação de login expirou ou é inválida. Inicie a conexão novamente.',
  oauth_failed: AUTH_MESSAGES.generic,
  server_error: 'O servidor encontrou um problema ao conectar sua conta. Tente novamente em instantes.',
  session_expired: AUTH_MESSAGES.expired,
};

export function isAuthConfigured(): boolean {
  return config.authEnabled;
}

function url(path: string): string {
  return `${config.apiBaseUrl}${path}`;
}

const discordUserSchema = z.object({
  id: z.string().regex(/^\d{17,20}$/),
  username: z.string().min(2).max(32),
  globalName: z.string().max(32).nullable().optional().transform((v) => v ?? null),
  avatar: z.string().regex(/^(a_)?[a-f0-9]{32}$/).nullable().optional().transform((v) => v ?? null),
});
const meResponseSchema = z.object({ user: discordUserSchema });

/** URL do avatar no CDN oficial do Discord (ou avatar padrão quando não há hash). */
export function buildAvatarUrl(user: Pick<DiscordUser, 'id' | 'avatar'>, size = 64): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  let index = 0;
  try {
    index = Number((BigInt(user.id) >> BigInt(22)) % BigInt(6));
  } catch {
    index = 0;
  }
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function toAuthUser(user: DiscordUser): AuthUser {
  return { ...user, displayName: user.globalName?.trim() || user.username, avatarUrl: buildAvatarUrl(user) };
}

/** Consulta a sessão atual. Só faz requisição quando o login está habilitado. */
export async function fetchSession(signal?: AbortSignal): Promise<SessionResult> {
  if (!isAuthConfigured()) return { kind: 'unavailable', reason: 'not_configured' };
  let res: Response;
  try {
    res = await fetch(url(AUTH_ENDPOINTS.me), { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, signal });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return { kind: 'unavailable', reason: 'offline' };
  }
  if (res.status === 401 || res.status === 403) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    return body?.code === 'session_expired' ? { kind: 'expired' } : { kind: 'unauthenticated' };
  }
  if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
    return { kind: 'unavailable', reason: 'offline' };
  }
  if (!res.ok) return { kind: 'error', message: AUTH_MESSAGES.generic };
  const parsed = meResponseSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) return { kind: 'error', message: AUTH_MESSAGES.generic };
  return { kind: 'authenticated', user: toAuthUser(parsed.data.user) };
}

/**
 * Inicia o OAuth2: navegação de página inteira para o backend, que redireciona ao Discord.
 * `returnTo` é um caminho relativo do próprio site (o backend deve validá-lo).
 */
export function startDiscordLogin(returnTo = `${window.location.pathname}${window.location.hash}`): void {
  if (!isAuthConfigured()) return;
  const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  window.location.assign(`${url(AUTH_ENDPOINTS.login)}?returnTo=${encodeURIComponent(safeReturn)}`);
}

/** Encerra a sessão no backend (o cookie HttpOnly é apagado pelo servidor). */
export async function logout(): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  try {
    const res = await fetch(url(AUTH_ENDPOINTS.logout), { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'tdr-web' } });
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

/**
 * Lê e remove da URL o erro devolvido pelo callback OAuth2 (`?auth_error=codigo`).
 * Retorna a mensagem amigável correspondente, ou null.
 */
export function consumeAuthErrorFromUrl(): { code: AuthErrorCode; message: string } | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('auth_error');
  if (!raw) return null;
  params.delete('auth_error');
  const qs = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  const code = (raw in ERROR_MESSAGES ? raw : 'oauth_failed') as AuthErrorCode;
  return { code, message: ERROR_MESSAGES[code] };
}
