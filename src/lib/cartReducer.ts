import type { CartItem, CustomerData, PartnershipType } from '../types/Order';
import type { ProductId } from '../types/Product';
import { isProductId } from '../data/products';
import { MAX_QUANTITY, sanitizeQuantity } from './pricing';

/** Estado local da encomenda (somente navegador). */
export interface OrderState {
  items: CartItem[];
  partnership: PartnershipType;
  partnerFaction: string;
  customer: CustomerData | null;
}

export type OrderAction =
  | { type: 'add'; productId: ProductId; quantity: number }
  | { type: 'setQuantity'; productId: ProductId; quantity: number }
  | { type: 'increment'; productId: ProductId }
  | { type: 'decrement'; productId: ProductId }
  | { type: 'remove'; productId: ProductId }
  | { type: 'clear' }
  | { type: 'setPartnership'; partnership: PartnershipType }
  | { type: 'setPartnerFaction'; value: string }
  | { type: 'setCustomer'; customer: CustomerData }
  | { type: 'reset' };

export const initialOrderState: OrderState = {
  items: [],
  partnership: 'sem_parceria',
  partnerFaction: '',
  customer: null,
};

function upsert(items: CartItem[], productId: ProductId, quantity: number): CartItem[] {
  const exists = items.some((i) => i.productId === productId);
  if (!exists) return [...items, { productId, quantity }];
  return items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
}

export function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'add': {
      const q = sanitizeQuantity(action.quantity);
      if (q === null || !isProductId(action.productId)) return state;
      const current = state.items.find((i) => i.productId === action.productId)?.quantity ?? 0;
      return { ...state, items: upsert(state.items, action.productId, Math.min(current + q, MAX_QUANTITY)) };
    }
    case 'setQuantity': {
      const q = sanitizeQuantity(action.quantity);
      if (q === null) return state;
      return { ...state, items: upsert(state.items, action.productId, q) };
    }
    case 'increment': {
      const item = state.items.find((i) => i.productId === action.productId);
      if (!item) return state;
      return { ...state, items: upsert(state.items, action.productId, Math.min(item.quantity + 1, MAX_QUANTITY)) };
    }
    case 'decrement': {
      const item = state.items.find((i) => i.productId === action.productId);
      if (!item) return state;
      if (item.quantity <= 1) return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
      return { ...state, items: upsert(state.items, action.productId, item.quantity - 1) };
    }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case 'clear':
      return { ...state, items: [] };
    case 'setPartnership':
      return { ...state, partnership: action.partnership };
    case 'setPartnerFaction':
      return { ...state, partnerFaction: action.value.slice(0, 40) };
    case 'setCustomer':
      return { ...state, customer: action.customer };
    case 'reset':
      return initialOrderState;
    default:
      return state;
  }
}

/** Restaura um estado salvo, descartando qualquer dado inválido ou adulterado. */
export function hydrateOrderState(raw: unknown): OrderState {
  if (!raw || typeof raw !== 'object') return initialOrderState;
  const data = raw as Partial<OrderState>;
  const items = Array.isArray(data.items)
    ? data.items.flatMap((i) => {
        const q = sanitizeQuantity((i as CartItem)?.quantity);
        return isProductId((i as CartItem)?.productId) && q !== null ? [{ productId: (i as CartItem).productId, quantity: q }] : [];
      })
    : [];
  return {
    items,
    partnership: data.partnership === 'com_parceria' ? 'com_parceria' : 'sem_parceria',
    partnerFaction: typeof data.partnerFaction === 'string' ? data.partnerFaction.slice(0, 40) : '',
    customer: null, // dados do personagem não são persistidos
  };
}
