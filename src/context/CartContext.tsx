import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { hydrateOrderState, initialOrderState, orderReducer, type OrderAction, type OrderState } from '../lib/cartReducer';
import { calculateItems, calculatePartnerSavings, calculateTotal, countUnits } from '../lib/pricing';
import type { OrderItem } from '../types/Order';

const STORAGE_KEY = 'tdr:cart:v1';

export interface CartContextValue {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  /** Linhas calculadas para a modalidade atual. */
  items: OrderItem[];
  total: number;
  units: number;
  partnerSavings: number;
}

export const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): OrderState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? hydrateOrderState(JSON.parse(raw)) : initialOrderState;
  } catch {
    return initialOrderState;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, undefined, loadInitial);

  // Persistência apenas da sessão (carrinho + modalidade). Dados do personagem não são salvos.
  useEffect(() => {
    try {
      const { items, partnership, partnerFaction } = state;
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ items, partnership, partnerFaction }));
    } catch {
      /* armazenamento indisponível: segue apenas em memória */
    }
  }, [state]);

  const value = useMemo<CartContextValue>(() => {
    const items = calculateItems(state.items, state.partnership);
    return {
      state,
      dispatch,
      items,
      total: calculateTotal(items),
      units: countUnits(state.items),
      partnerSavings: calculatePartnerSavings(state.items),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
