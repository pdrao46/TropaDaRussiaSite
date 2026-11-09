import { Hammer, Link2, Package, Shield, VenetianMask, type LucideIcon } from 'lucide-react';
import type { ProductId } from '../../types/Product';

/** Apresentação visual (ícones) separada dos dados do catálogo. */
export const PRODUCT_ICONS: Record<ProductId, LucideIcon> = {
  algema: Link2,
  capuz: VenetianMask,
  'pe-de-cabra': Hammer,
  colete: Shield,
  'box-attachs': Package,
};

export function savingsPercent(normal: number, partner: number): number {
  return Math.round(((normal - partner) / normal) * 100);
}
