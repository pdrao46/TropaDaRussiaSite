/**
 * POST /api/orders — cria uma encomenda.
 * GET  /api/orders — lista as encomendas de quem está autenticado.
 *
 * Regras:
 *  - Preços são SEMPRE recalculados no servidor (o corpo do navegador é ignorado).
 *  - Com sessão ativa, a identidade do Discord vem do banco, nunca do formulário.
 *  - Parceria só vale o desconto se estiver aprovada no banco.
 */
import { config, isDatabaseConfigured } from './_lib/config.js';
import { createOrder, listMyOrders, resolvePartnership, validateOrderInput } from './_lib/orders.js';
import { resolveSession } from './_lib/session.js';
import { audit, rateLimit } from './_lib/security.js';
import {
  badRequest,
  clientIp,
  created,
  fail,
  methodGuard,
  ok,
  readBody,
  serverError,
  unauthorized,
} from './_lib/http.js';

export default async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();

  if (method === 'GET') return listMine(req, res);

  const blocked = methodGuard(req, res, 'POST');
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return fail(res, 503, 'service_unavailable', 'O serviço de encomendas está temporariamente indisponível.');
  }

  // Limite por IP: protege contra spam de pedidos.
  const limit = await rateLimit(`orders:${clientIp(req)}`, Math.max(5, Math.floor(config.orders.rateLimitPerMinute / 2)), 60);
  if (!limit.allowed) {
    return fail(res, 429, 'rate_limited', 'Muitas encomendas em sequência. Aguarde um minuto e tente novamente.');
  }

  try {
    const session = await resolveSession(req);
    const authenticatedSession = session.kind === 'ok' ? session : null;

    if (session.kind === 'expired') {
      return unauthorized(res, 'Sua sessão expirou. Conecte-se novamente.', 'session_expired');
    }

    const body = readBody(req);

    /* 1) validação ---------------------------------------------------------- */
    const validation = validateOrderInput(body, authenticatedSession);
    if (!validation.ok) {
      return badRequest(res, 'Revise os dados da encomenda.', validation.issues);
    }

    /* 2) pedidos abertos? --------------------------------------------------- */
    const ordersEnabled = await ordersAreEnabled();
    if (!ordersEnabled) {
      return fail(res, 403, 'orders_paused', 'As encomendas estão temporariamente pausadas. Tente novamente mais tarde.');
    }

    /* 3) parceria ----------------------------------------------------------- */
    const partnership = await resolvePartnership({
      partnership: validation.value.partnership,
      partnerFaction: validation.value.partnerFaction,
    });

    /* 4) criação atômica (transação no Postgres) ---------------------------- */
    const result = await createOrder({
      input: validation.value,
      session: authenticatedSession,
      partnership,
    });

    const order = result?.order;
    if (!order?.code) {
      return fail(res, 502, 'order_failed', 'Não foi possível registrar a encomenda. Tente novamente.');
    }

    await audit(req, {
      actorType: authenticatedSession ? 'user' : 'anonymous',
      actorId: order.discord_id,
      action: 'order.created',
      entityType: 'order',
      entityId: order.code,
      details: {
        total: order.total,
        priceMode: order.price_mode,
        status: order.status,
        items: validation.value.items,
      },
    });

    /* 5) resposta ----------------------------------------------------------- */
    const warnings = [];
    if (partnership.pendingReview) {
      warnings.push('Preço de parceria solicitado: o pedido ficará em verificação até a aprovação da facção parceira.');
    }
    if (partnership.downgraded) {
      warnings.push('Parceria ainda não aprovada: o pedido foi registrado com o preço normal.');
    }

    return created(res, {
      status: 'success',
      orderId: order.code,
      order: {
        code: order.code,
        status: order.status,
        total: order.total,
        priceMode: order.price_mode,
        createdAt: order.created_at,
      },
      message: `Encomenda ${order.code} registrada com sucesso.`,
      warnings,
    });
  } catch (err) {
    const message = String(err?.message ?? '');
    if (message.includes('unknown_product')) {
      return badRequest(res, 'Um dos produtos não está disponível no catálogo.');
    }
    if (message.includes('quantity_above_limit') || message.includes('invalid_quantity')) {
      return badRequest(res, 'Quantidade inválida para um dos produtos.');
    }
    if (message.includes('empty_items') || message.includes('too_many_items')) {
      return badRequest(res, 'A encomenda exige entre 1 e 20 itens.');
    }
    return serverError(res, err, 'criação de encomenda');
  }
}

async function ordersAreEnabled() {
  try {
    const row = await (await import('../api/_lib/db.js')).db.selectOne('app_settings', { key: 'eq.orders_enabled' });
    return row?.value !== false && row?.value !== 'false';
  } catch {
    return true; // falha ao ler a configuração não deve impedir a venda
  }
}

async function listMine(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return fail(res, 503, 'service_unavailable', 'O serviço de encomendas está temporariamente indisponível.');
  }

  try {
    const session = await resolveSession(req);
    if (session.kind !== 'ok') {
      return unauthorized(res, 'Conecte sua conta Discord para consultar suas encomendas.', 'unauthenticated');
    }
    const orders = await listMyOrders(session);
    return ok(res, { count: orders.length, orders });
  } catch (err) {
    return serverError(res, err, 'consulta das minhas encomendas');
  }
}
