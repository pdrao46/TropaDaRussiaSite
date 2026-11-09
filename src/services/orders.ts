import { config } from '../config/env';
import type { OrderDraft, OrderPayload, SubmitOrderResult } from '../types/Order';

export const BACKEND_PENDING_MESSAGE =
  'O serviço de encomendas está temporariamente indisponível. Tente novamente em alguns instantes.';

/** Monta o corpo da requisição a partir do rascunho revisado. */
export function buildOrderPayload(draft: OrderDraft): OrderPayload {
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    partnership: draft.partnership,
    partnerFaction: draft.partnership === 'com_parceria' ? draft.partnerFaction?.trim() || undefined : undefined,
    customer: draft.customer,
    items: draft.items.map(({ productId, quantity }) => ({ productId, quantity })),
    clientPreview: { items: draft.items, total: draft.total, currency: 'BRL_RP' },
  };
}

/** Endpoints reais do backend (mesma origem por padrão). */
export const ORDERS_ENDPOINTS = {
  create: '/api/orders',
  mine: '/api/orders/my',
} as const;

function apiUrl(path: string): string {
  return `${config.apiBaseUrl}${path}`;
}

/** Leitura segura do JSON (nunca lança). */
async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Envia a encomenda ao backend.
 *
 * - Usa `credentials: 'include'` para levar o cookie HttpOnly da sessão.
 * - Nunca inventa confirmação: só responde `success` com um `orderId` real.
 * - `clientPreview` é apenas informativo: o servidor recalcula todos os valores.
 */
export async function submitOrder(order: OrderPayload): Promise<SubmitOrderResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl(ORDERS_ENDPOINTS.create), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(order),
    });
  } catch {
    return { status: 'error', message: 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.' };
  }

  const data = await readJson(res);
  const message = typeof data?.message === 'string' ? data.message : undefined;

  if (res.status === 200 || res.status === 201) {
    const orderId = typeof data?.orderId === 'string' ? data.orderId : '';
    if (!orderId) {
      return { status: 'error', message: 'O servidor não confirmou o número da encomenda. Tente novamente.' };
    }
    const warnings = Array.isArray(data?.warnings) ? (data.warnings as string[]) : [];
    return { status: 'success', orderId, message, warnings };
  }

  if (res.status === 400) {
    const issues = data?.issues;
    const first = Array.isArray(issues) ? (issues[0] as { message?: string })?.message : undefined;
    return { status: 'error', message: first ?? message ?? 'Revise os dados da encomenda.' };
  }
  if (res.status === 401) {
    return { status: 'error', message: 'Sua sessão expirou. Conecte-se novamente ao Discord para enviar a encomenda.' };
  }
  if (res.status === 403) {
    return { status: 'error', message: message ?? 'As encomendas estão temporariamente pausadas.' };
  }
  if (res.status === 429) {
    return { status: 'error', message: message ?? 'Muitas tentativas seguidas. Aguarde um minuto.' };
  }
  if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
    return { status: 'not_configured', message: BACKEND_PENDING_MESSAGE };
  }
  return { status: 'error', message: message ?? 'Não foi possível enviar a encomenda. Tente novamente.' };
}

/* ------------------------------------------------------- MINHAS ENCOMENDAS */

export interface ApiOrderItem {
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApiOrder {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  partnership: string;
  partnerFaction?: string | null;
  priceMode: string;
  total: number;
  currency: string;
  customer: {
    characterName: string;
    characterId: string;
    factionName: string;
    phoneRp: string;
    discordUser: string;
    discordId: string;
    notes?: string | null;
  };
  items: ApiOrderItem[];
  history: { status: string; label: string; note?: string | null; at: string }[];
  discord?: { published: boolean; messageId?: string | null; assignedTo?: string | null };
}

export type MyOrdersResult =
  | { kind: 'ok'; orders: ApiOrder[] }
  | { kind: 'unauthenticated' }
  | { kind: 'error'; message: string };

/** Lista as encomendas da conta conectada. */
export async function fetchMyOrders(signal?: AbortSignal): Promise<MyOrdersResult> {
  try {
    const res = await fetch(apiUrl(ORDERS_ENDPOINTS.mine), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal,
    });
    if (res.status === 401 || res.status === 403) return { kind: 'unauthenticated' };
    if (!res.ok) return { kind: 'error', message: 'Não foi possível carregar suas encomendas.' };
    const data = await readJson(res);
    const orders = Array.isArray(data?.orders) ? (data.orders as ApiOrder[]) : [];
    return { kind: 'ok', orders };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return { kind: 'error', message: 'Falha de conexão ao carregar suas encomendas.' };
  }
}
