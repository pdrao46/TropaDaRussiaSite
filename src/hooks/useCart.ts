import { useCallback, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import type { CustomerData, PartnershipType } from '../types/Order';
import type { ProductId } from '../types/Product';

/** API do carrinho para os componentes. Toda a lógica fica no reducer/pricing. */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>.');
  const { dispatch } = ctx;

  return {
    ...ctx,
    add: useCallback((productId: ProductId, quantity = 1) => dispatch({ type: 'add', productId, quantity }), [dispatch]),
    setQuantity: useCallback((productId: ProductId, quantity: number) => dispatch({ type: 'setQuantity', productId, quantity }), [dispatch]),
    increment: useCallback((productId: ProductId) => dispatch({ type: 'increment', productId }), [dispatch]),
    decrement: useCallback((productId: ProductId) => dispatch({ type: 'decrement', productId }), [dispatch]),
    remove: useCallback((productId: ProductId) => dispatch({ type: 'remove', productId }), [dispatch]),
    clear: useCallback(() => dispatch({ type: 'clear' }), [dispatch]),
    setPartnership: useCallback((partnership: PartnershipType) => dispatch({ type: 'setPartnership', partnership }), [dispatch]),
    setPartnerFaction: useCallback((value: string) => dispatch({ type: 'setPartnerFaction', value }), [dispatch]),
    setCustomer: useCallback((customer: CustomerData) => dispatch({ type: 'setCustomer', customer }), [dispatch]),
    quantityOf: (productId: ProductId) => ctx.state.items.find((i) => i.productId === productId)?.quantity ?? 0,
  };
}
