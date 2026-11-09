import type { Product, ProductId } from '../types/Product';

/**
 * CATÁLOGO OFICIAL — TROPA DA RÚSSIA
 * Fonte única de verdade dos preços no frontend. NÃO ALTERAR OS VALORES.
 * Valores fictícios do GTA Roleplay, em reais inteiros.
 */
export const PRODUCTS: readonly Product[] = [
  { id: 'algema', name: 'Algema', price: { normal: 7_500, partner: 5_750 }, category: 'ferramentas' },
  { id: 'capuz', name: 'Capuz', price: { normal: 9_000, partner: 7_500 }, category: 'protecao' },
  { id: 'pe-de-cabra', name: 'Pé de Cabra', price: { normal: 70_000, partner: 65_000 }, category: 'ferramentas' },
  { id: 'colete', name: 'Colete', price: { normal: 17_000, partner: 15_000 }, category: 'protecao' },
  { id: 'box-attachs', name: 'Caixa de Attachments', price: { normal: 12_900, partner: 9_350 }, category: 'ferramentas' },
] as const;

const PRODUCT_MAP = new Map<ProductId, Product>(PRODUCTS.map((p) => [p.id, p]));

export function getProductById(id: ProductId): Product | undefined {
  return PRODUCT_MAP.get(id);
}

export function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && PRODUCT_MAP.has(value as ProductId);
}
