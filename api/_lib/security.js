/**
 * Primitivas de segurança: aleatoriedade, hash, comparação em tempo constante,
 * controle de taxa e registro de auditoria.
 */
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { db } from './db.js';
import { clientIp } from './http.js';

/** Token aleatório seguro em URL-safe base64/hex. */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256hex(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

/** Hash do token de sessão com "pimenta" (SESSION_SECRET). */
export function hashSessionToken(token) {
  return sha256hex(`${config.sessionSecret}:${token}`);
}

/** Comparação de strings em tempo constante. */
export function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ------------------------------------------------------------ RATE LIMIT */

const memoryBuckets = new Map();

/**
 * Controle de taxa por chave, com fallback em memória quando o banco falha.
 * Janela fixa de 60 segundos.
 */
export async function rateLimit(key, limit = config.orders.rateLimitPerMinute, windowSeconds = 60) {
  const now = Date.now();

  try {
    const row = await db.selectOne('rate_limits', { key: `eq.${key}` });
    const started = row?.window_started_at ? Date.parse(row.window_started_at) : 0;
    const expired = !started || now - started > windowSeconds * 1000;

    if (!row) {
      await db.insert('rate_limits', { key, count: 1, window_started_at: new Date().toISOString() });
      return { allowed: true, remaining: limit - 1 };
    }
    if (expired) {
      await db.update('rate_limits', { key: `eq.${key}` }, { count: 1, window_started_at: new Date().toISOString() });
      return { allowed: true, remaining: limit - 1 };
    }
    const next = Number(row.count ?? 0) + 1;
    await db.update('rate_limits', { key: `eq.${key}` }, { count: next });
    if (next > limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(0, limit - next) };
  } catch {
    // Banco indisponível: limita em memória para não abrir mão da proteção.
    const bucket = memoryBuckets.get(key);
    if (!bucket || now - bucket.started > windowSeconds * 1000) {
      memoryBuckets.set(key, { started: now, count: 1 });
      return { allowed: true, remaining: limit - 1 };
    }
    bucket.count += 1;
    if (bucket.count > limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(0, limit - bucket.count) };
  }
}

/* -------------------------------------------------------------- AUDITORIA */

/** Registra uma ação na tabela audit_logs. Nunca lança (auditoria não derruba a API). */
export async function audit(req, { actorType, actorId, action, entityType, entityId, details }) {
  try {
    await db.insert('audit_logs', {
      actor_type: actorType ?? 'anonymous',
      actor_id: actorId ? String(actorId).slice(0, 64) : null,
      action: String(action).slice(0, 120),
      entity_type: entityType ?? null,
      entity_id: entityId ? String(entityId).slice(0, 120) : null,
      details: details ?? null,
      ip: req ? clientIp(req) : null,
    });
  } catch (err) {
    console.error('[tdr-api] falha ao auditar:', err?.message ?? err);
  }
}

/** Registra um evento de integração (direção site↔bot). */
export async function integrationEvent({ eventType, orderId, orderCode, direction, source, status, payload }) {
  try {
    await db.insert('integration_events', {
      event_type: eventType,
      order_id: orderId ?? null,
      order_code: orderCode ?? null,
      direction,
      source: source ?? 'website',
      status: status ?? null,
      payload: payload ?? null,
    });
  } catch (err) {
    console.error('[tdr-api] falha ao registrar evento de integração:', err?.message ?? err);
  }
}

export { randomUUID };
