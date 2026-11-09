/**
 * GET /api/products
 *
 * Catálogo oficial (fonte: banco de dados). Público e somente leitura.
 * Exatamente cinco produtos — valores em moeda fictícia do GTA RP.
 */
import { listProducts } from './_lib/orders.js';
import { methodGuard, ok, serverError } from './_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  try {
    const products = await listProducts({ onlyActive: true });
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return ok(res, {
      currency: 'BRL_RP',
      count: products.length,
      products,
    });
  } catch (err) {
    return serverError(res, err, 'consulta do catálogo');
  }
}
