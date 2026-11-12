import type { CartItem, OrderItem, PartnershipType } from '../types/Order';
import type { Product } from '../types/Product';
import { getProductById } from '../data/products.ts';

/** Quantidade máxima por item (proteção de interface; o backend define a regra final). */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 999;

/**
 * Normaliza qualquer entrada para um inteiro positivo dentro dos limites.
 * - Rejeita negativos, decimais, NaN e texto.
 * - Retorna `null` quando o valor não é aproveitável.
 */
export function sanitizeQuantity(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  if (int < MIN_QUANTITY) return MIN_QUANTITY;
  if (int > MAX_QUANTITY) return MAX_QUANTITY;
  return int;
}

/** Preço unitário oficial para a modalidade (nunca vem do usuário). */
export function getUnitPrice(product: Product, partnership: PartnershipType): number {
  return partnership === 'com_parceria' ? product.price.partner : product.price.normal;
}

/** Converte o carrinho em linhas calculadas. Itens desconhecidos são ignorados. */
export function calculateItems(cart: readonly CartItem[], partnership: PartnershipType): OrderItem[] {
  const items: OrderItem[] = [];
  for (const entry of cart) {
    const product = getProductById(entry.productId);
    const quantity = sanitizeQuantity(entry.quantity);
    if (!product || quantity === null) continue;
    const unitPrice = getUnitPrice(product, partnership);
    items.push({ productId: product.id, name: product.name, quantity, unitPrice, subtotal: unitPrice * quantity });
  }
  return items;
}

export function calculateTotal(items: readonly OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function countUnits(cart: readonly CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/** Economia da parceria em relação ao preço normal, para o carrinho atual. */
export function calculatePartnerSavings(cart: readonly CartItem[]): number {
  const normal = calculateTotal(calculateItems(cart, 'sem_parceria'));
  const partner = calculateTotal(calculateItems(cart, 'com_parceria'));
  return normal - partner;
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formata em pt-BR: 17000 → "R$ 17.000" (espaço normal, sem centavos). */
export function formatBRL(value: number): string {
  return BRL.format(Math.round(value)).replace(/\u00a0/g, ' ');
}
