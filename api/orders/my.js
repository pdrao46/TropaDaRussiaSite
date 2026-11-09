/**
 * GET /api/orders/my — encomendas do usuário autenticado.
 */
import { isDatabaseConfigured } from '../_lib/config.js';
import { listMyOrders } from '../_lib/orders.js';
import { resolveSession } from '../_lib/session.js';
import { fail, methodGuard, ok, serverError, unauthorized } from '../_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return fail(res, 503, 'service_unavailable', 'O serviço de encomendas está temporariamente indisponível.');
  }

  try {
    const session = await resolveSession(req);
    if (session.kind === 'expired') {
      return unauthorized(res, 'Sua sessão expirou. Conecte-se novamente.', 'session_expired');
    }
    if (session.kind !== 'ok') {
      return unauthorized(res, 'Conecte sua conta Discord para consultar suas encomendas.', 'unauthenticated');
    }

    const orders = await listMyOrders(session);
    return ok(res, { count: orders.length, orders });
  } catch (err) {
    return serverError(res, err, 'consulta das minhas encomendas');
  }
}
