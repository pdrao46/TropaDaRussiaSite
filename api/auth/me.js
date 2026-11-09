/**
 * GET /api/auth/me
 *
 * 200 → { user: { id, username, globalName, avatar } }
 * 401 → { code: 'unauthenticated' }  (sem sessão)
 * 401 → { code: 'session_expired' }  (sessão existia mas expirou)
 */
import { isAuthConfigured } from '../_lib/config.js';
import { resolveSession, publicUser } from '../_lib/session.js';
import { clearCookie, methodGuard, ok, serverError, unauthorized } from '../_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  if (!isAuthConfigured()) {
    return unauthorized(res, 'Autenticação não configurada.', 'auth_not_configured');
  }

  try {
    const session = await resolveSession(req);

    if (session.kind === 'expired') {
      clearCookie(res, 'tdr_session', { path: '/' });
      return unauthorized(res, 'Sessão expirada.', 'session_expired');
    }
    if (session.kind !== 'ok' || !session.user) {
      return unauthorized(res, 'Não autenticado.', 'unauthenticated');
    }

    return ok(res, { user: publicUser(session.user) });
  } catch (err) {
    return serverError(res, err, 'consulta de sessão');
  }
}
