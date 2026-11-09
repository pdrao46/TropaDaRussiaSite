/**
 * Tipos públicos da autenticação Discord — TROPA DA RÚSSIA.
 * Nenhum token OAuth2 trafega pelo frontend: a sessão vive em cookie HttpOnly
 * definido pelo backend (Arena). O navegador só conhece os dados PÚBLICOS abaixo.
 */

/** Dados públicos do usuário autenticado, como devolvidos por `GET /api/auth/me`. */
export interface DiscordUser {
  /** Snowflake do Discord (17 a 20 dígitos), como string. */
  id: string;
  /** Nome de usuário único do Discord (ex.: "tdr.membro"). */
  username: string;
  /** Nome de exibição global (pode ser nulo). */
  globalName: string | null;
  /** Hash do avatar no CDN do Discord (nulo = avatar padrão). */
  avatar: string | null;
}

/** Usuário pronto para a interface (com URL de avatar resolvida). */
export interface AuthUser extends DiscordUser {
  /** Nome exibido na interface: globalName ou username. */
  displayName: string;
  /** URL do avatar no CDN oficial do Discord. */
  avatarUrl: string;
}

/**
 * Estados da interface de autenticação.
 * - `checking`: verificando a sessão existente ao carregar a página.
 * - `unauthenticated`: sem sessão — exibe "Entrar com Discord".
 * - `connecting`: redirecionando para o Discord / aguardando retorno.
 * - `authenticated`: sessão válida — exibe avatar e nome.
 * - `expired`: a sessão expirou — oferece reconectar.
 * - `error`: falha na autenticação — oferece tentar novamente.
 * - `unavailable`: backend de login ainda não configurado ou fora do ar.
 */
export type AuthStatus = 'checking' | 'unauthenticated' | 'connecting' | 'authenticated' | 'expired' | 'error' | 'unavailable';

/** Motivo de indisponibilidade: login ainda não integrado ou serviço fora do ar. */
export type UnavailableReason = 'not_configured' | 'offline';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Mensagem amigável para os estados `error`, `expired` e `unavailable`. */
  message?: string;
  unavailableReason?: UnavailableReason;
}

/** Resultado normalizado de `GET /api/auth/me`. */
export type SessionResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'unauthenticated' }
  | { kind: 'expired' }
  | { kind: 'unavailable'; reason: UnavailableReason }
  | { kind: 'error'; message: string };

/** Erros que o backend pode devolver no retorno do OAuth2 (`?auth_error=`). */
export type AuthErrorCode = 'access_denied' | 'invalid_state' | 'oauth_failed' | 'server_error' | 'session_expired';
