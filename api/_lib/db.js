/**
 * Cliente mínimo do Supabase (PostgREST) — usa apenas `fetch`, sem dependências.
 *
 * Todo acesso é feito com a SERVICE ROLE KEY, que ignora RLS. Por isso este
 * módulo só pode ser importado por código de servidor (funções em /api).
 */
import { config } from './config.js';

const REST_ROOT = () => `${config.supabaseUrl}/rest/v1`;

function headers(extra = {}) {
  return {
    apikey: config.supabaseServiceRoleKey,
    authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'content-type': 'application/json',
    accept: 'application/json',
    ...extra,
  };
}

async function request(path, { method = 'GET', body, prefer, extraHeaders, signal } = {}) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }
  const url = `${REST_ROOT()}/${path}`;
  const res = await fetch(url, {
    method,
    headers: headers({ ...(prefer ? { prefer } : {}), ...extraHeaders }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${detail.slice(0, 500)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Constrói a query string aceita pelo PostgREST a partir de um objeto. */
function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const db = {
  /** SELECT. `query` usa a sintaxe do PostgREST (select, id=eq.x, order, limit...). */
  async select(table, query = {}, { prefer } = {}) {
    const rows = await request(`${table}${toQuery(query)}`, { method: 'GET', prefer });
    return Array.isArray(rows) ? rows : [];
  },

  async selectOne(table, query = {}) {
    const rows = await db.select(table, { limit: 1, ...query });
    return rows[0] ?? null;
  },

  /** INSERT. `prefer` default devolve a linha criada. */
  async insert(table, rows, { prefer = 'return=representation' } = {}) {
    const payload = Array.isArray(rows) ? rows : [rows];
    const result = await request(table, { method: 'POST', body: payload, prefer });
    return Array.isArray(result) ? result : [];
  },

  async insertOne(table, row, options) {
    const rows = await db.insert(table, row, options);
    return rows[0] ?? null;
  },

  /** UPDATE com filtro obrigatório (evita alterar a tabela inteira por acidente). */
  async update(table, filters, patch, { prefer = 'return=representation' } = {}) {
    if (!filters || Object.keys(filters).length === 0) {
      throw new Error(`UPDATE em "${table}" exige filtro.`);
    }
    const result = await request(`${table}${toQuery(filters)}`, { method: 'PATCH', body: patch, prefer });
    return Array.isArray(result) ? result : [];
  },

  async updateOne(table, filters, patch, options) {
    const rows = await db.update(table, filters, patch, options);
    return rows[0] ?? null;
  },

  /** DELETE com filtro obrigatório. */
  async remove(table, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      throw new Error(`DELETE em "${table}" exige filtro.`);
    }
    return request(`${table}${toQuery(filters)}`, { method: 'DELETE' });
  },

  /**
   * Chamada a uma função SQL (RPC).
   * O PostgREST já devolve o valor desserializado: escalar, objeto ou array —
   * por isso o resultado é repassado exatamente como veio.
   */
  async rpc(fn, params = {}, { prefer } = {}) {
    return request(`rpc/${fn}`, { method: 'POST', body: params, prefer });
  },
};

/** Gera o próximo código legível de pedido: TDR-000001. */
export async function nextOrderCode() {
  const code = await db.rpc('next_order_code');
  if (typeof code === 'string' && code.startsWith('TDR-')) return code;
  throw new Error('Falha ao gerar o código do pedido.');
}
