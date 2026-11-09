/**
 * GET /api/health — verificação rápida da API e do banco.
 * Não expõe segredos: apenas status e contadores básicos.
 */
import { config, isAuthConfigured, isDatabaseConfigured } from './_lib/config.js';
import { db } from './_lib/db.js';
import { methodGuard, ok } from './_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  const checks = { api: 'ok', database: 'unknown', catalog: 'unknown' };

  if (isDatabaseConfigured()) {
    try {
      const products = await db.select('products', { select: 'slug', active: 'eq.true', limit: 10 });
      checks.database = 'ok';
      checks.catalog = products.length === 5 ? 'ok' : `esperado 5, encontrado ${products.length}`;
    } catch (err) {
      checks.database = `erro: ${String(err?.message ?? err).slice(0, 120)}`;
    }
  } else {
    checks.database = 'não configurado';
  }

  return ok(res, {
    service: 'tropa-da-russia-api',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    auth: isAuthConfigured() ? 'configured' : 'missing_credentials',
    guildConfigured: Boolean(config.guildId),
    checks,
  });
}
