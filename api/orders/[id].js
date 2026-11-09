/**
 * GET /api/orders/:code — detalhes de uma encomenda (TDR-000001).
 *
 * Só devolve o pedido para o próprio autor (por user_id ou discord_id da sessão).
 * Pedidos de outras pessoas retornam 403 — nunca 404 com dados.
 */
import { isDatabaseConfigured } from '../_lib/config.js';
import { getOrderFor } from '../_lib/orders.js';
import { resolveSession } from '../_lib/session.js';
import { fail, forbidden, methodGuard, notFound, ok, serverError, unauthorized } from '../_lib/http.js';

const CODE_PATTERN = /^TDR-\d{1,12}$/i;

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return fail(res, 503, 'service_unavailable', 'O serviço de encomendas está temporariamente indisponível.');
  }

  const code = String(req.query?.id ?? req.query?.code ?? '').trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return notFound(res, 'Encomenda não encontrada.');
  }

  try {
    const session = await resolveSession(req);
    if (session.kind === 'expired') {
      return unauthorized(res, 'Sua sessão expirou. Conecte-se novamente.', 'session_expired');
    }
    if (session.kind !== 'ok') {
      return unauthorized(res, 'Conecte sua conta Discord para consultar a encomenda.', 'unauthenticated');
    }

    const order = await getOrderFor(code, session);
    if (order?.forbidden) return forbidden(res, 'Esta encomenda pertence a outra conta.');
    if (!order) return notFound(res, 'Encomenda não encontrada.');

    return ok(res, { order });
  } catch (err) {
    return serverError(res, err, 'consulta da encomenda');
  }
}
