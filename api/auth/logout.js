/**
 * POST /api/auth/logout
 *
 * Revoga a sessão no banco e apaga o cookie HttpOnly. Responde 204.
 */
import { destroySession, resolveSession } from '../_lib/session.js';
import { audit } from '../_lib/security.js';
import { methodGuard, noContent, serverError } from '../_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'POST');
  if (blocked) return blocked;

  try {
    const session = await resolveSession(req);
    await destroySession(req, res);

    if (session.kind === 'ok') {
      await audit(req, {
        actorType: 'user',
        actorId: session.user?.discord_id ?? null,
        action: 'auth.logout',
      });
    }
    return noContent(res);
  } catch (err) {
    return serverError(res, err, 'logout');
  }
}
